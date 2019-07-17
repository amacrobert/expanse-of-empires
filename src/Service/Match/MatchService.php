<?php

namespace App\Service\Match;

use App\Controller\SocketController;
use Doctrine\ORM\EntityManagerInterface;
use App\Exception\VisibleException;
use App\Entity\User\User;
use App\Entity\Match\{Match, Empire, TerritoryState, Building, Army};
use App\Entity\Map\Territory;
use App\Struct\SupportPathPriorityQueue;

class MatchService {

    private $em;

    const STARTING_SUPPLY = 100;
    const STARTING_TIDE = 100;
    const TRAIN_ARMY_SUPPLY = -10;
    const TRAIN_ARMY_TIDE = -10;
    const MAX_ATTACK_SIZE = 5;
    const MAX_DEFENSE_SIZE = 5;
    const MIN_NPC_ARMY_SIZE = 1;
    const MAX_NPC_ARMY_SIZE = 6;

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

        // Tell match service new empire exists
        $empire->territory_count = 1;
        $this->socket_controller->broadcastToMatch($match->getId(), [
            'action' => 'new-empire',
            'updates' => [
                'empires' => [$empire],
                'territories' => [$territory],
                'resources' => [
                    'supply' => $empire->getSupply(),
                    'tide' => $empire->getTide(),
                ],
            ],
        ]);
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

    public function moveUnits(User $user, Match $match, array $territory_path, int $units) {

        $empire = $this->em->getRepository(Empire::class)->findOneBy([
            'user' => $user,
            'match' => $match,
        ]);

        // Check that we're in a phase where moving armies is allowed
        $phase = $match->getPhase();
        if (!in_array($phase, ['non-player-combat', 'expanse-of-empires'])) {
            throw new VisibleException('Moving armies is not allowed in current phase: ' . $phase);
        }

        $this->hydrateMapState($match, $territory_path);

        // Check that the user has at the requested units in the starting territory
        $territory_start = current($territory_path);
        if (!$territory_start instanceof Territory) {
            throw new VisibleException('There was an error trying to execute the move command. Please refresh and try again.');
        }
        $user_army_start = $this->getEmpireArmyInTerritory($empire, $territory_start);

        if (!$user_army_start || $user_army_start->getSize() < $units) {
            throw new VisibleException('You do not have ' . $units . ' units in the starting territory to move');
        }

        $tide_cost_per_unit = 0;
        foreach ($territory_path as $order => $territory) {

            $state = $territory->getState();

            // Make sure there is a direct path from the previous territory to the current one
            if (!empty($territory_path[$order - 1])) {
                $previous_territory = $territory_path[$order - 1];
                if (!$this->territoriesAreNeighbors($territory, $previous_territory)) {
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

            print 'path ' . $order . ': t.id ' . $territory->getId() . ', terrain cost: ' . $territory->getTerrain()->getBaseTideCost() . PHP_EOL;
        }

        // Check that the user has enough tide to complete the move
        $tide_cost = $tide_cost_per_unit * $units;
        if ($tide_cost > $empire->getTide()) {
            throw new VisibleException('You do not have enough Tide to make that move. Needed: ' . $tide_cost . ', current: ' . $empire->getTide());
        }

        // Move units
        $territory_end = end($territory_path);
        $user_army_end = $this->getEmpireArmyInTerritory($empire, $territory_end, true);
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

    public function attack(
        User $user,
        Match $match,
        Territory $attacking_territory,
        Territory $defending_territory,
        int $attacking_units
    ) {
        $attacking_empire = $this->em->getRepository(Empire::class)->findOneBy([
            'user' => $user,
            'match' => $match,
        ]);

        $this->hydrateMapState($match, [$attacking_territory, $defending_territory]);

        $npc_is_defending = true;
        $defending_empire = null;

        if ($defending_state = $defending_territory->getState()) {
            if ($defending_empire = $defending_state->getEmpire()) {
                $npc_is_defending = false;
            }
        }

        $player_is_defending = !$npc_is_defending;

        // Check that we're in a phase where attacking is allowed
        $phase = $match->getPhase();
        if ($npc_is_defending && !in_array($phase, ['non-player-combat', 'expanse-of-empires'])) {
            throw new VisibleException('Attacking is not allowed in current phase: ' . $phase);
        }
        else if ($player_is_defending && $phase != 'expanse-of-empires') {
            throw new VisibleException('Attacking other empires is not allowed in current phase: ' . $phase);
        }

        // Make sure user owns the attacking territory
        $attacking_empire = $attacking_territory->getState()->getEmpire();
        if ($attacking_empire->getUser() != $user) {
            throw new VisibleException('You do you control the attacking territory anymore.');
        }

        // Make sure defending territory is owned by enemy of player
        // @TODO: Do not allow attacking allies
        if ($defending_empire == $attacking_empire) {
            throw new VisibleException('You or an ally already own the defending territory');
        }

        // Make sure defending territory borders attacking territory
        if (!$this->territoriesAreNeighbors($attacking_territory, $defending_territory)) {
            throw new VisibleException("You cannot attack $defending_territory from $attacking_territory");
        }

        // Make sure attacker has all the units they're attacking with
        $attacking_army = $this->getEmpireArmyInTerritory($attacking_empire, $attacking_territory, true);
        if ($attacking_army->getSize() < $attacking_units) {
            throw new VisibleException('You no longer have at least ' . $attacking_units . ' units in the attacking territory');
        }

        // Make sure attack size is not beyond the maximum
        if ($attacking_units > self::MAX_ATTACK_SIZE) {
            throw new VisibleException('You may not attack with that many units at once');
        }

        // Make sure attacking player has enough tide to attack
        $tide_cost = $defending_territory->getTerrain()->getBaseTideCost() * $attacking_units;
        if ($attacking_empire->getTide() < $tide_cost) {
            throw new VisibleException('Not enough Tide');
        }

        // If the defending territory has no state, create it
        if (!$defending_state) {
            $defending_state = (new TerritoryState)
                ->setTerritory($defending_territory)
                ->setMatch($match)
                ->setEmpire($defending_empire)
            ;

            // If the defending territory is an NPC, give them an army
            if ($npc_is_defending) {
                // @TODO: increase NPC bonus over time
                $npc_bonus = 0;
                $army_size = rand(self::MIN_NPC_ARMY_SIZE, self::MAX_NPC_ARMY_SIZE);
                $army_size += $npc_bonus;
                $defending_state->addArmy((new Army)->setSize($army_size));
            }

            $this->em->persist($defending_state);
            $defending_territory->setState($defending_state);
        }

        // Calculate defense party
        $defending_units = 0;
        $defending_armies = $defending_state->getArmies();

        foreach ($defending_armies as $defending_army) {
            $defending_units += $defending_army->getSize();
            if ($defending_units >= self::MAX_DEFENSE_SIZE) {
                $defending_units = self::MAX_DEFENSE_SIZE;
                break;
            }
        }

        // Each attacking and defending unit rolls a 100-sided die
        $defense_rolls = $attack_rolls = [];

        for ($i = 0; $i < $defending_units; $i++) {
            $defense_rolls[] = rand(1, 100);
        }

        for ($i = 0; $i < $attacking_units; $i++) {
            $attack_rolls[] = rand(1, 100);
        }

        // Sort the attack and defense rolls high to low
        rsort($defense_rolls);
        rsort($attack_rolls);

        // Determine outcome
        $size_of_larger_army = max(count($defense_rolls), count($attack_rolls));
        $outcomes = [];
        $defeated_defense_units = $defeated_attack_units = 0;

        for ($i = 0; $i < $size_of_larger_army; $i++) {

            $defense_bonuses = $attack_bonuses = [];
            $defense_score = $defense_roll = $defense_rolls[$i] ?? null;
            $attack_score = $attack_roll = $attack_rolls[$i] ?? null;
            $winner = null;

            if ($defense_roll !== null) {
                // Defense bonuses
                if ($fortification = $defending_state->getFortification()) {
                    $defense_bonuses['fortification'] = $fortification;
                }

                // @TODO: Add support bonuses and penalties
                // @TODO: Add tech bonuses

                $defense_score = $defense_roll;
                foreach ($defense_bonuses as $bonus) {
                    $defense_score += $bonus;
                }
            }

            if ($attack_roll !== null) {

                // Add bonuses
                $attack_score = $attack_roll;
                foreach ($attack_bonuses as $bonus) {
                    $attack_score += $bonus;
                }
            }

            // Compare ordered scores against one another to determine defeats
            if ($defense_roll !== null && $attack_roll !== null) {
                if ($defense_score > $attack_score) {
                    $winner = 'defender';
                    $defeated_attack_units++;
                }
                elseif ($attack_score > $defense_score) {
                    $winner = 'attacker';
                    $defeated_defense_units++;
                }
                else {
                    $winner = 'draw';
                    $defeated_attack_units++;
                    $defeated_defense_units++;
                }
            }

            $outcomes[] = [
                'attack_roll' => $attack_roll,
                'defense_roll' => $defense_roll,
                'attack_bonuses' => $attack_bonuses,
                'defense_bonuses' => $defense_bonuses,
                'attack_score' => $attack_score,
                'defense_score' => $defense_score,
                'winner' => $winner,
            ];
        }

        // distribute losses amongst defending armies
        $losses_to_distribute = $defeated_defense_units;
        $total_defending_armies = count($defending_armies);
        $i = 0;
        while ($losses_to_distribute > 0) {
            $army_index = $i % $total_defending_armies;
            $defending_army = $defending_armies[$army_index];

            $army_size = $defending_army->getSize();
            if ($army_size > 0) {
                $defending_army->setSize($army_size - 1);
                $losses_to_distribute--;
            }

            $i++;
        }

        // take the loss from the attacking army
        $attacking_army->setSize($attacking_army->getSize() - $defeated_attack_units);

        // If all defending armies were defeated, the attacker takes the territory
        $attacker_takes_territory = true;
        foreach ($defending_armies as $defending_army) {
            if ($defending_army->getSize() > 0) {
                $attacker_takes_territory = false;
            }
        }

        if ($attacker_takes_territory) {
            $defending_territory->getState()->setEmpire($attacking_empire);
        }

        // @TODO: manage resources

        $this->em->flush(array_merge(
            [$defending_state, $attacking_army],
            $defending_armies->toArray()
        ));

        $this->socket_controller->broadcastToMatch($match->getId(), [
            'action' => 'territory-attacked',
            'output' => [
                'territory_taken' => $attacker_takes_territory,
                'outcomes' => $outcomes,
                'defeated_defense_units' => $defeated_defense_units,
                'defeated_attack_units' => $defeated_attack_units,
                'attacking_territory' => (string)$attacking_territory,
                'defending_territory' => (string)$defending_territory,
            ],
            'updates' => [
                'territories' => [
                    $defending_territory,
                    $attacking_territory,
                ],
                // 'resources' => [
                //     'supply' => $empire->getSupply(),
                //     'tide' => $empire->getTide(),
                // ],
            ],
        ]);
    }

    // Compute the support for territories in a match
    public function computeSupport(Match $match) {

        $this->hydrateMapState($match);

        $territories = $match->getMap()->getTerritories();

        foreach ($territories as $territory) {
            if ($territory->getState() && $territory->getState()->getEmpire()) {
                $path = $this->computeShortestPathToCastle($match, $territory);

                $this->clearMapTempValues($match);

                if ($path === null) {
                    print "No path from $territory to castle" . PHP_EOL;
                }
                else {
                    print "Path from $territory to closest castle is " . count($path) . PHP_EOL;
                }
            }
        }
    }

    private function clearMapTempValues($match) {
        // unset temp territory members
        foreach ($match->getMap()->getTerritories() as $territory) {
            delete $territory->came_from;
            delete $territory->distance_so_far;
        }
    }

    private function computeShortestPathToCastle(Match $match, Territory $start) {
        $territory_id = $start->getId();
        $start->distance_so_far = 0;
        $start->came_from = null;

        $frontier = new \SplPriorityQueue();
        $frontier->insert($start, 0);
        $start_empire = $start->getState()->getEmpire();

        // print "FROM $start" . PHP_EOL;

        while (!$frontier->isEmpty()) {

            // print ' frontier size: ' . count($frontier) . PHP_EOL;

            $current = $frontier->extract();

            // Found the closest castle
            if ($current_state = $current->getState()) {
                if ($building = $current_state->getBuilding()) {
                    if ($building->getMachineName() == 'castle') {
                        $path = [];
                        $trace = $current;

                        while ($trace) {
                            $path[] = $trace;
                            $trace = $trace->came_from;
                        }

                        return $path;
                    }
                }
            }

            $neighbors = $this->getBorderingTerritories($match, $start);
            // print ' neighbors: ' . count($neighbors) . PHP_EOL;

            foreach ($neighbors as $next) {
                if ($next) {
                    // print "  looking at $next" . PHP_EOL;
                    $distance = 1; // @TODO: Possibly replace with tide cost of territory to restrict supply through
                               // difficult terrain
                    $new_distance = $current->distance_so_far + $distance;
                    $has_visited = isset($next->came_from);
                    $is_closer = $new_distance < ($next->distance_so_far ?? PHP_INT_MAX);

                    // print "  new dist: " . $new_distance . PHP_EOL;
                    // print "  has_visited: " . $has_visited . PHP_EOL;
                    // print "  is_closer: " . $is_closer . PHP_EOL;

                    $is_traversable = false;
                    if ($next_state = $next->getState()) {
                        if ($next_empire = $next_state->getEmpire()) {
                            // @TODO: allow support through allies' territories
                            $is_traversable = $next_empire == $start_empire;
                        }
                    }

                    // print "  is_traversable: " . $is_traversable . PHP_EOL;

                    if ($is_traversable && (!$has_visited || $is_closer)) {
                        $next->distance_so_far = $new_distance;
                        $frontier->insert($next, $new_distance);
                        $next->came_from = $current;

                        // print "inserted $next into frontier" . PHP_EOL;
                    }
                }
            }
        }

        return null;
    }

    private function getBorderingTerritories($match, $territory) {

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

    // @TODO: possible performance improvement by caching in 2D array
    private function getTerritory($match, $q, $r) {
        foreach ($match->getMap()->getTerritories() as $territory) {
            if ($territory->getAxialQ() == $q && $territory->getAxialR() == $r) {
                return $territory;
            }
        }

        return null;
    }

    private function territoriesAreNeighbors(Territory $t1, Territory $t2): bool {
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

    private function getEmpireArmyInTerritory(
        Empire $empire,
        Territory $territory,
        bool $create_if_missing = false
    ): ?Army {

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

    public function hydrateMapState(Match $match, array $territories = null) {

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
