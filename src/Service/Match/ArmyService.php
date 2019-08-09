<?php

namespace App\Service\Match;

use App\Entity\User\User;
use App\Entity\Match\{Match, Empire, Army};
use App\Entity\Map\Territory;
use App\Service\Map\MapService;
use Doctrine\ORM\EntityManagerInterface;
use App\Controller\SocketController;
use App\Exception\VisibleException;

class ArmyService
{
    const TRAIN_ARMY_SUPPLY = -10;
    const TRAIN_ARMY_TIDE = -10;

    private $em;
    private $socket_controller;
    private $match_service;
    private $map_service;

    public function __construct(
        EntityManagerInterface $em,
        SocketController $socket_controller,
        MatchService $match_service,
        MapService $map_service)
    {
        $this->em = $em;
        $this->socket_controller = $socket_controller;
        $this->match_service = $match_service;
        $this->map_service = $map_service;
    }

    public function trainArmy(User $user, Match $match, Territory $territory): void
    {
        // Get the user's empire
        $empire = $this->em->getRepository(Empire::class)->findOneBy([
            'user' => $user,
            'match' => $match,
        ]);

        // Check that we're in a phase where training armies is allowed
        $phase = $match->getPhase();
        if (!in_array($phase, ['registration', 'non-player-combat', 'expanse-of-empires'])) {
            throw new VisibleException('Training armies is not allowed in current phase: ' . $phase);
        }

        // Check that the user occupies the territory
        $this->match_service->hydrateMapState($match);
        $state = $territory->getState();
        if (!$state || $state->getEmpire() != $empire) {
            throw new VisibleException('You do not control that territory.');
        }

        // Check that the territory has a building capable of training armies
        if (!$state || !$state->getBuilding() || !in_array($state->getBuilding()->getMachineName(), ['castle', 'barracks'])) {
            throw new VisibleException('You need a Castle or Barracks to train an army.');
        }

        // Check that the user has enough supply and tide
        if ($empire->getSupply() + self::TRAIN_ARMY_SUPPLY < 0) {
            throw new VisibleException('You do not have enough Supply to train an army');
        }
        if ($empire->getTide() + self::TRAIN_ARMY_TIDE < 0) {
            throw new VisibleException('You do not have enough Tide to train an army');
        }

        // Get existing army or create new if none exists. Update army size.
        $army = $this->em->getRepository(Army::class)->findOneBy([
            'territory_state' => $state,
            'empire' => $empire,
        ]);

        if (!$army) {
            $army = (new Army)
                ->setTerritoryState($state)
                ->setEmpire($empire)
            ;
            $this->em->persist($army);
        }

        $empire->setSupply($empire->getSupply() + self::TRAIN_ARMY_SUPPLY);
        $empire->setTide($empire->getTide() + self::TRAIN_ARMY_TIDE);
        $army->setSize($army->getSize() + 1);
        $this->em->flush([$empire, $army]);

        // Broadcast new army to user (@TODO: broadcast to alliance)
        $this->socket_controller->broadcastToUser($match->getId(), $user->getId(), [
            'action' => 'army-trained',
            'updates' => [
                'territories' => [$territory],
                'resources' => [
                    'supply' => $empire->getSupply(),
                    'tide' => $empire->getTide(),
                ]
            ]
        ]);
    }

    public function moveUnits(User $user, Match $match, array $territory_path, int $units): void
    {
        $empire = $this->em->getRepository(Empire::class)->findOneBy([
            'user' => $user,
            'match' => $match,
        ]);

        // Check that we're in a phase where moving armies is allowed
        $phase = $match->getPhase();
        if (!in_array($phase, ['non-player-combat', 'expanse-of-empires'])) {
            throw new VisibleException('Moving armies is not allowed in current phase: ' . $phase);
        }

        $this->match_service->hydrateMapState($match, $territory_path);

        // Check that the user has at the requested units in the starting territory
        $territory_start = current($territory_path);
        if (!$territory_start instanceof Territory) {
            throw new VisibleException('There was an error trying to execute the move command. Please refresh and try again.');
        }
        $user_army_start = $this->match_service->getEmpireArmyInTerritory($empire, $territory_start);

        if (!$user_army_start || $user_army_start->getSize() < $units) {
            throw new VisibleException('You do not have ' . $units . ' units in the starting territory to move');
        }

        $tide_cost_per_unit = 0;
        foreach ($territory_path as $order => $territory) {

            $state = $territory->getState();

            // Make sure there is a direct path from the previous territory to the current one
            if (!empty($territory_path[$order - 1])) {
                $previous_territory = $territory_path[$order - 1];
                if (!$this->map_service->territoriesAreNeighbors($territory, $previous_territory)) {
                    throw new VisibleException('Invalid path. ' . $territory->getId() . 'isnot neighbor of ' . $previous_territory->getId());
                }
            }

            // Check that the user controls the territory
            // @TODO: allow traversal through an allies' territories
            if ($state->getEmpire() != $empire) {
                throw new VisibleException('That path is no longer valid. You or an ally have lost one of the territories in the path.');
            }

            // Add the tide cost of the territory to the total
            if ($order != 0) {
                $tide_cost_per_unit += $territory->getTerrain()->getBaseTideCost();
            }
        }

        // Check that the user has enough tide to complete the move
        $tide_cost = $tide_cost_per_unit * $units;
        if ($tide_cost > $empire->getTide()) {
            throw new VisibleException('You do not have enough Tide to make that move. Needed: ' . $tide_cost . ', current: ' . floor($empire->getTide()));
        }

        // Move units
        $territory_end = end($territory_path);
        $user_army_end = $this->match_service->getEmpireArmyInTerritory($empire, $territory_end, true);
        $user_army_start->setSize($user_army_start->getSize() - $units);
        $user_army_end->setSize($user_army_end->getSize() + $units);

        // Reduce tide
        $empire->setTide($empire->getTide() - $tide_cost);

        // Save everything
        $this->em->flush([$user_army_start, $user_army_end, $empire]);

        // Broadcast unit move to user. @TODO: broadcast to alliance
        $this->socket_controller->broadcastToUser($match->getId(), $user->getId(), [
            'action' => 'units-moved',
            'updates' => [
                'territories' => [
                    $territory_start,
                    $territory_end,
                ],
                'resources' => [
                    'tide' => $empire->getTide(),
                ]
            ],
        ]);
    }
}
