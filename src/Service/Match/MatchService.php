<?php

namespace App\Service\Match;

use App\Controller\SocketController;
use Doctrine\ORM\EntityManagerInterface;
use Exception;
use App\Entity\User\User;
use App\Entity\Match\{Match, Empire, TerritoryState, Building};
use App\Entity\Map\Territory;

class MatchService {

    private $em;

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
            throw new Exception('Registration is not open for this match');
        }

        // Check the user doesn't already have an empire in this match
        if ($empire) {
            throw new Exception('You already have an empire in this match');
        }

        // Check that the territory is unoccupied
        $this->hydrateMapState($match);
        if ($territory->empire_id) {
            throw new Exception('That territory has already been claimed | ' . $territory->empire_id);
        }

        // Check that the territory is a valid starting position
        if (!$territory->isStartingPosition()) {
            throw new Exception('That territory is not a valid starting position');
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

        $this->em->clear();
    }

    public function hydrateMapState($match) {
        $territory_states = $this->em->getRepository(TerritoryState::class)->findByMatch($match);

        foreach ($territory_states as $territory_state) {
            $territory = $territory_state->getTerritory();
            $territory->setState($territory_state);
        }
    }
}
