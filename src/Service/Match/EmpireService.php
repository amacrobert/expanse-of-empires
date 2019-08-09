<?php

namespace App\Service\Match;

use App\Controller\SocketController;
use Doctrine\ORM\EntityManagerInterface;
use App\Exception\VisibleException;
use App\Entity\User\User;
use App\Entity\Match\{Match, Empire, TerritoryState, Building, Army};
use App\Entity\Map\Territory;

class EmpireService
{
    const STARTING_SUPPLY = 100;
    const STARTING_TIDE = 100;
    const COLOR_CODES = [
        'e6194b',
        '3cb44b',
        'ffe119',
        '4363d8',
        'f58231',
        '911eb4',
        '46f0f0',
        'f032e6',
        'bcf60c',
        'fabebe',
        '008080',
        'e6beff',
        '9a6324',
        'fffac8',
        '800000',
        'aaffc3',
        '808000',
        'ffd8b1',
        '000075',
        '808080',
        'ffffff',
        '000000',
    ];

    public function __construct(
        SocketController $socket_controller,
        EntityManagerInterface $em,
        MatchService $match_service)
    {
        $this->em = $em;
        $this->socket_controller = $socket_controller;
        $this->match_service = $match_service;
    }

    public function createEmpire(User $user, Match $match, Territory $territory): void
    {
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
        $this->match_service->hydrateMapState($match);
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

        // Create a new territory state if it doesn't exist
        if (!$state) {
            $state = (new TerritoryState)
                ->setMatch($match)
                ->setTerritory($territory)
                ->setSupport(MatchService::HIGH_SUPPLY)
            ;
            $this->em->persist($state);
        }

        // Place a castle on the capital
        $state->setBuilding($this->em->find(Building::class, 1));
        $territory->setState($state);

        // Get the number of existing empires to assign the new one the next color in order
        $empire_count = $this->em->createQueryBuilder()
            ->select('count(empire.id)')
            ->from(Empire::class, 'empire')
            ->where('empire.match = :match')
            ->setParameter('match', $match)
            ->getQuery()
            ->getSingleScalarResult()
        ;

        // Create the new empire
        $empire = (new Empire)
            ->setUser($user)
            ->setMatch($match)
            ->setCapital($territory)
            ->setActive(true)
            ->setSupply(self::STARTING_SUPPLY)
            ->setTide(self::STARTING_TIDE)
            ->setColor(self::COLOR_CODES[$empire_count % count(self::COLOR_CODES)])
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
}
