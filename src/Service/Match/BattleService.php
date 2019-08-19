<?php

namespace App\Service\Match;

use App\Controller\SocketController;
use Doctrine\ORM\EntityManagerInterface;
use App\Entity\User\User;
use App\Entity\Match\{Match, Empire, TerritoryState, Army};
use App\Entity\Map\Territory;
use App\Exception\VisibleException;
use App\Service\Map\MapService;

class BattleService
{
    const MAX_ATTACK_SIZE = 5;
    const MAX_DEFENSE_SIZE = 5;
    const MIN_NPC_ARMY_SIZE = 3;
    const MAX_NPC_ARMY_SIZE = 6;
    const ATTACKING_TIDE_COST_COEF = 2; // twice as much tide cost to attack than to move
    const FAILED_ATTACK_TIDE_REFUND_COEF = 0.5; // you get refunded tide at this rate in case of a failed attack

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

    public function attack(
        User $user,
        Match $match,
        Territory $attacking_territory,
        Territory $defending_territory,
        int $attacking_units)
    {
        $attacking_empire = $this->em->getRepository(Empire::class)->findOneBy([
            'user' => $user,
            'match' => $match,
        ]);

        $this->match_service->hydrateMapState($match, [$attacking_territory, $defending_territory]);

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
        if (!$this->map_service->territoriesAreNeighbors($attacking_territory, $defending_territory)) {
            throw new VisibleException('You cannot attack '. $defending_territory .' from $attacking_territory');
        }

        // Make sure attacker has all the units they're attacking with
        $attacking_army = $this->match_service->getEmpireArmyInTerritory($attacking_empire, $attacking_territory, true);
        if ($attacking_army->getSize() < $attacking_units) {
            throw new VisibleException('You no longer have at least ' . $attacking_units . ' units in the attacking territory');
        }

        // Make sure attack size is not beyond the maximum
        if ($attacking_units > self::MAX_ATTACK_SIZE) {
            throw new VisibleException('You may not attack with that many units at once');
        }

        // Make sure attacking player has enough tide to attack
        $tide_cost = $defending_territory->getTerrain()->getBaseTideCost() * $attacking_units * self::ATTACKING_TIDE_COST_COEF;
        if ($attacking_empire->getTide() < $tide_cost) {
            throw new VisibleException('Not enough Tide');
        }

        $socket_message_for_match = $socket_message_for_alliance = [];

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

        // $total_defending_armies = count($defending_armies);
        // $defending_units = 0;
        // $armies_all_in = 0;
        // $defending_units_by_empire_id = [];

        // while ($defending_units < self::MAX_DEFENSE_SIZE) {
        //     $army_index = $defending_units % $total_defending_armies;
        //     $defending_army = $defending_armies[$army_index];

        //     $army_size = $defending_army->getSize();
        //     if ($army_size > 0) {
        //         $defending_army->setSize($army_size - 1);
        //         $losses_to_distribute--;
        //     }

        //     $i++;
        // }

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

                if ($attack_support = $attacking_territory->getState()->getSupport()) {
                    $attack_bonuses[] = [
                        'name' => 'support',
                        'bonus' => $attack_support,
                    ];
                }
                if ($defense_support = $defending_territory->getState()->getSupport()) {
                    $defense_bonuses[] = [
                        'name' => 'support',
                        'bonus' => $defense_support,
                    ];
                }

                // @TODO: Add tech bonuses

                $defense_score = $defense_roll;
                foreach ($defense_bonuses as $bonus) {
                    $defense_score += $bonus['bonus'];
                }
            }

            if ($attack_roll !== null) {

                // Add bonuses
                $attack_score = $attack_roll;
                foreach ($attack_bonuses as $bonus) {
                    $attack_score += $bonus['bonus'];
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
        $attacking_units_left = $attacking_units - $defeated_attack_units;

        // Attacker won
        if ($attacker_takes_territory) {

            // Give attacker the territory
            $defending_territory->getState()->setEmpire($attacking_empire);

            // Re-calculate the support now that a territory has changed hands
            $updated_territories = [];
            $this->match_service->computeSupport($match, $updated_territories, [$attacking_empire, $defending_empire], [$defending_territory]);

            // Move what's left of the attacking units into the newly won territory
            $attacking_army->setSize($attacking_army->getSize() - $attacking_units_left);
            $new_territory_army = $this->match_service->getEmpireArmyInTerritory($attacking_empire, $defending_territory, true);
            $new_territory_army->setSize($attacking_units_left);

            $socket_message_for_match['ui_action'] = [
                'action' => 'units-moved',
                'empire_id' => $attacking_empire->getId(),
                'from_id' => $attacking_territory->getId(),
                'to_id' => $defending_territory->getId(),
                'units_moved' => $attacking_units_left,
            ];
        }

        // Subtract tide from the attacker, at a rate dependent upon whether or not the territory was won
        $final_tide_cost = $tide_cost * ($attacker_takes_territory ? 1 : self::FAILED_ATTACK_TIDE_REFUND_COEF);
        $attacking_empire->setTide($attacking_empire->getTide() - $final_tide_cost);

        $this->em->flush(array_merge(
            [$defending_state, $attacking_army, $attacking_empire],
            $defending_armies->toArray()
        ));

        $socket_message_for_alliance += [
            'action' => 'territory-attacked',
            'output' => [
                'territory_taken' => $attacker_takes_territory,
                'outcomes' => $outcomes,
                'defeated_defense_units' => $defeated_defense_units,
                'defeated_attack_units' => $defeated_attack_units,
                'attacking_territory_id' => $attacking_territory->getId(),
                'defending_territory_id' => $defending_territory->getId(),
            ],
            'updates' => [
                'resources' => [
                    'tide' => $attacking_empire->getTide(),
                ],
            ],
        ];

        $socket_message_for_match += [
            'action' => 'territory-attacked-in-match',
            'updates' => [
                'territories' => array_values(array_unique(array_merge(
                    ($updated_territories ?? []),
                    [$defending_territory, $attacking_territory]
                ))),
            ]
        ];

        $this->socket_controller->broadcastToUser($match->getId(), $user->getId(), $socket_message_for_alliance);
        $this->socket_controller->broadcastToMatch($match->getId(), $socket_message_for_match);
    }
}
