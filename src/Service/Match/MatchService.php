<?php

namespace App\Service\Match;

use App\Controller\SocketController;
use Doctrine\ORM\EntityManagerInterface;
use App\Exception\VisibleException;
use App\Entity\User\User;
use App\Entity\Match\{Match, Empire, TerritoryState, Building, Army};
use App\Entity\Map\Territory;

class MatchService {

    private $em;

    const STARTING_SUPPLY = 100;
    const STARTING_TIDE = 100;
    const TRAIN_ARMY_SUPPLY = -10;
    const TRAIN_ARMY_TIDE = -10;

    public function __construct(
        SocketController $socket_controller,
        EntityManagerInterface $em
    ) {
        $this->socket_controller = $socket_controller;
        $this->em = $em;
    }

    public function createEmpire(User $user, Match $match, Territory $territory) {

        $empire = $this->em->getRepository(Empire::class)->findOneBy([
            'user' => $user,
            'match' => $match,
        ]);

        // Check that registration is open
        if ($match->getPhase() !== 'registration') {
            throw new VisibleException('Registration is not open for this match.');
        }

        // Check the user doesn't already have an empire in this match
        if ($empire) {
            throw new VisibleException('You already have an empire in this match.');
        }

        // Check that the territory is unoccupied
        $this->hydrateMapState($match);
        if ($territory->getState() && $territory->getState()->getEmpire()) {
            throw new VisibleException('That territory has already been claimed.');
        }

        // Check that the territory is a valid starting position
        if (!$territory->isStartingPosition()) {
            throw new VisibleException('That territory is not a valid starting position.');
        }

        $state = $this->em->getRepository(TerritoryState::class)->findOneBy([
            'territory' => $territory,
            'match' => $match,
        ]);

        // There should always be a state for every territory per match, but if there isn't create one
        if (!$state) {
            $state = new TerritoryState;
            $state
                ->setMatch($match)
                ->setTerritory($territory)
            ;
            $this->em->persist($state);
        }

        // Place a castle on the capital
        $state->setBuilding($this->em->find(Building::class, 1));
        $territory->setState($state);

        $empire = new Empire;
        $empire
            ->setUser($user)
            ->setMatch($match)
            ->setActive(true)
            ->setSupply(self::STARTING_SUPPLY)
            ->setTide(self::STARTING_TIDE)
        ;
        $this->em->persist($empire);

        $state->setEmpire($empire);

        $this->em->flush([$empire, $state]);

        // Update map
        $territory->setState($state);
        $this->socket_controller->broadcastToMatch($match->getId(), [
            'action' => 'territory-update',
            'territory' => $territory,
        ]);

        // Tell match service new empire exists
        $empire->territory_count = 1;
        $this->socket_controller->broadcastToMatch($match->getId(), [
            'action' => 'new-empire',
            'supply' => $empire->getSupply(),
            'tide' => $empire->getTide(),
            'empire' => $empire,
        ]);

        $this->em->clear();
    }

    public function trainArmy($user, $match, $territory) {

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
        $this->hydrateMapState($match);
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

        // Broadcast new army to user
        $this->socket_controller->broadcastToUser($match->getId(), $user->getId(), [
            'action' => 'army-trained',
            'supply' => $empire->getSupply(),
            'tide' => $empire->getTide(),
        ]);

        // Broadcast territory update to user (@TODO: broadcast to alliance)
        print json_encode($territory);
        $this->socket_controller->broadcastToUser($match->getId(), $user->getId(), [
            'action' => 'territory-update',
            'territory' => $territory,
        ]);

        $this->em->clear();
    }

    public function hydrateMapState($match) {
        $territory_states = $this->em->getRepository(TerritoryState::class)->findByMatch($match);

        foreach ($territory_states as $territory_state) {
            $territory = $territory_state->getTerritory();
            $territory->setState($territory_state);
        }
    }

    public function getDetails($match) {
        $this->hydrateMapState($match);

        $empires = $match->getEmpires();
        $territories = $match->getMap()->getTerritories();
        $territory_counts_by_empire_id = [];

        foreach ($territories as $territory) {
            $empire = $territory->getState() ? $territory->getState()->getEmpire() : null;
            if ($empire && $empire_id = $empire->getId()) {
                if (isset($territory_counts_by_empire_id[$empire_id])) {
                    $territory_counts_by_empire_id[$empire_id]++;
                }
                else {
                    $territory_counts_by_empire_id[$empire_id] = 1;
                }
            }
        }

        foreach ($empires as $empire) {
            $count = $territory_counts_by_empire_id[$empire->getId()] ?? 0;
            $empire->territory_count = $count;
        }

        return [
            'id'                => $match->getId(),
            'name'              => $match->getName(),
            'speed'             => $match->getSpeed(),
            'date_registration' => $match->getDateRegistration()->format('Y-m-d H:i:s T'),
            'date_npc'          => $match->getDateNPC()->format('Y-m-d H:i:s T'),
            'date_p2p'          => $match->getDateP2P()->format('Y-m-d H:i:s T'),
            'date_completed'    => $match->getDateCompleted() ? $match->getDateCompleted()->format('Y-m-d H:i:s T') : null,
            'completed'         => $match->getDateCompleted() ? true : false,
            'phase'             => $match->getPhase(),
            'map_name'          => $match->getMap() ? $match->getMap()->getName() : 'Map not chosen yet',
            'user_joined'       => (bool)$match->getUserEmpire(),
            'empires'           => $match->getEmpires()->toArray(),
            'map'               => $match->getMap(),
        ];
    }
}
