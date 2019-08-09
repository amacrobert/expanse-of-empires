<?php

namespace App\Service\Match;

use App\Controller\SocketController;
use Doctrine\ORM\EntityManagerInterface;
use App\Exception\VisibleException;
use App\Entity\User\User;
use App\Entity\Match\{Match, Empire, TerritoryState, Building, Army};
use App\Entity\Map\Territory;
use App\Service\Map\MapService;

class MatchService
{
    const HIGH_SUPPLY = 20;
    const MED_SUPPLY = 10;
    const LOW_SUPPLY = 5;
    const NO_SUPPLY = -20;
    const HIGH_SUPPLY_RADIUS = 3;
    const MED_SUPPLY_RADIUS = 6;

    private $em;
    private $map_service;
    private $socket_controller;

    public function __construct(
        SocketController $socket_controller,
        EntityManagerInterface $em,
        MapService $map_service)
    {
        $this->em = $em;
        $this->socket_controller = $socket_controller;
        $this->map_service = $map_service;
    }

    // Compute the support for territories in a match
    public function computeSupport(
        Match $match,
        array &$updated_territories = null,
        array $empires = null,
        array $additional_territories = null)
    {
        $this->hydrateMapState($match);

        // If empires given, only check territories belonging to them
        if ($empires) {
            $territories = $this->em->createQuery('
                SELECT territory
                FROM App\Entity\Map\Territory territory
                JOIN App\Entity\Match\TerritoryState state WITH state.territory = territory
                WHERE state.empire IN (:empires)')
                ->setParameter('empires', $empires)
                ->getResult();

            if ($additional_territories) {
                $territories = array_merge($territories, $additional_territories);
                $territories = array_unique($territories);
            }
        }
        // Otherwise, recompute support for every territory in the match
        else {
            $territories = $match->getMap()->getTerritories();
        }

        foreach ($territories as $territory) {

            $state = $territory->getState();

            if ($state && $state->getEmpire()) {

                $path = $this->map_service->computeShortestPathToCastle($match, $territory);

                if ($path === null) {
                    $support = self::NO_SUPPLY;
                }
                else {
                    $path_length = count($path) - 1;

                    if ($path_length <= self::HIGH_SUPPLY_RADIUS) {
                        $support = self::HIGH_SUPPLY;
                    }
                    else if ($path_length <= self::MED_SUPPLY_RADIUS) {
                        $support = self::MED_SUPPLY;
                    }
                    else {
                        $support = self::LOW_SUPPLY;
                    }
                }

                if ($state->getSupport() != $support) {
                    $state->setSupport($support);
                    $updated_territories[] = $territory;
                }
            }
        }

        $this->em->flush();
    }

    public function getEmpireArmyInTerritory(
        Empire $empire,
        Territory $territory,
        bool $create_if_missing = false): ?Army
    {
        $territory_armies = $territory->getState()->getArmies()->toArray();
        $empire_armies = array_filter($territory_armies, function($army) use ($empire) {
            return $army->getEmpire() == $empire;
        });

        if (!empty($empire_armies)) {
            return current($empire_armies);
        }

        if ($create_if_missing) {
            $army = (new Army)
                ->setEmpire($empire)
                ->setSize(0)
            ;
            $this->em->persist($army);
            $territory->getState()->addArmy($army);
            $this->em->flush([$territory->getState()]);

            return $army;
        }

        return null;
    }

    public function hydrateMapState(Match $match, array $territories = null): void
    {
        $search_params = ['match' => $match];
        if (!empty($territories)) {
            $search_params['territory'] = $territories;
        }

        $territory_states = $this->em->getRepository(TerritoryState::class)->findBy($search_params);

        foreach ($territory_states as $territory_state) {
            $territory = $territory_state->getTerritory();
            $territory->setState($territory_state);
        }
    }

    public function getDetails($match): array
    {
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
