<?php

namespace App\Service\Map;

use App\Entity\Match\Match;
use App\Entity\Map\Territory;
use SplPriorityQueue;

class MapService
{
    // @TODO: possible performance improvement by caching in 2D array
    private function getTerritory(Match $match, int $q, int $r): ?Territory
    {
        foreach ($match->getMap()->getTerritories() as $territory) {
            if ($territory->getAxialQ() == $q && $territory->getAxialR() == $r) {
                return $territory;
            }
        }

        return null;
    }

    public function territoriesAreNeighbors(Territory $t1, Territory $t2): bool
    {
        $t1_q = $t1->getAxialQ();
        $t1_r = $t1->getAxialR();
        $t2_q = $t2->getAxialQ();
        $t2_r = $t2->getAxialR();

        return (
            ($t1_q == $t2_q + 0 && $t1_r == $t2_r - 1) || // top left neighbor
            ($t1_q == $t2_q + 1 && $t1_r == $t2_r - 1) || // top right neighbor
            ($t1_q == $t2_q + 1 && $t1_r == $t2_r + 0) || // right neighbor
            ($t1_q == $t2_q + 0 && $t1_r == $t2_r + 1) || // bottom right neighbor
            ($t1_q == $t2_q - 1 && $t1_r == $t2_r + 1) || // bottom left neighbor
            ($t1_q == $t2_q - 1 && $t1_r == $t2_r + 0)    // left neighbor
        );
    }

    private function getBorderingTerritories(Match $match, Territory $territory): array
    {
        $q = $territory->getAxialQ();
        $r = $territory->getAxialR();

        return array_filter([
            $this->getTerritory($match, $q - 1, $r),
            $this->getTerritory($match, $q, $r - 1),
            $this->getTerritory($match, $q + 1, $r - 1),
            $this->getTerritory($match, $q + 1, $r),
            $this->getTerritory($match, $q, $r + 1),
            $this->getTerritory($match, $q - 1, $r + 1),
        ]);
    }

    public function computeShortestPathToCastle(Match $match, Territory $start): array
    {
        $distance_so_far = [];
        $came_from = [];

        $territory_id = $start->getId();
        $distance_so_far[$territory_id] = 0;
        $came_from[$territory_id] = null;

        $frontier = new SplPriorityQueue();
        $frontier->insert($start, PHP_INT_MAX);
        $start_empire = $start->getState()->getEmpire();

        while (!$frontier->isEmpty()) {

            $current = $frontier->extract();

            // Found the closest castle
            if ($current_state = $current->getState()) {
                if ($building = $current_state->getBuilding()) {
                    if ($building->getMachineName() == 'castle') {

                        $path = [];
                        $trace = $current;

                        while ($trace) {
                            $path[] = $trace->getId();
                            $trace = $came_from[$trace->getId()];
                        }

                        return array_reverse($path);
                    }
                }
            }

            $neighbors = $this->getBorderingTerritories($match, $current);

            foreach ($neighbors as $next) {
                if ($next) {
                    $distance = 1; // @TODO: Possibly replace with tide cost of territory to restrict supply through
                                   // difficult terrain
                    $new_distance = $distance_so_far[$current->getId()] + $distance;
                    $has_visited = array_key_exists($next->getId(), $came_from);
                    $is_closer = $new_distance < ($distance_so_far[$next->getId()] ?? PHP_INT_MAX);

                    $is_traversable = false;
                    if ($next_state = $next->getState()) {
                        if ($next_empire = $next_state->getEmpire()) {
                            // @TODO: allow support through allies' territories
                            $is_traversable = ($next_empire == $start_empire);
                        }
                    }

                    if ($is_traversable && (!$has_visited || $is_closer)) {
                        $distance_so_far[$next->getId()] = $new_distance;
                        $frontier->insert($next, PHP_INT_MAX - $new_distance);
                        $came_from[$next->getId()] = $current;
                    }
                }
            }
        }

        return null;
    }
}
