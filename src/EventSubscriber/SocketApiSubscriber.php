<?php

namespace App\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\GetResponseForExceptionEvent;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\KernelEvents;
use App\Service\Chat\ChatService;
use App\Service\Match\{MatchService, EmpireService, ArmyService, BattleService};
use App\Entity\Match\Match;
use App\Entity\Map\Territory;

class SocketApiSubscriber implements EventSubscriberInterface
{
    private $em;
    private $chat_service;
    private $empire_service;
    private $army_service;
    private $battle_service;

    public function __construct(
        EntityManagerInterface $em,
        ChatService $chat_service,
        EmpireService $empire_service,
        ArmyService $army_service,
        BattleService $battle_service)
    {
        $this->em = $em;
        $this->chat_service = $chat_service;
        $this->empire_service = $empire_service;
        $this->army_service = $army_service;
        $this->battle_service = $battle_service;
    }

    public static function getSubscribedEvents() {

        return [
            'socket.chat.send' =>       'userSentChat',
            'socket.iam' =>             'userJoinedChat',
            'socket.empire.start' =>    'startEmpire',
            'socket.train.army' =>      'trainArmy',
            'socket.move.units' =>      'moveUnits',
            'socket.attack' =>          'attack',
        ];
    }

    public function userSentChat($event) {
        $this->chat_service->chatSent($event->getSubject(), $event->getArgument('user'));
    }

    public function userJoinedChat($event) {
        $this->chat_service->chatJoin($event->getSubject()->match_id, $event->getArgument('user'));
    }

    public function startEmpire($event) {
        $this->deriveMessageData($event, $user, $match, $territory);
        $this->empire_service->createEmpire($user, $match, $territory);
    }

    public function trainArmy($event) {
        $this->deriveMessageData($event, $user, $match, $territory);
        $this->army_service->trainArmy($user, $match, $territory);
    }

    public function moveUnits($event) {
        // Get some message data
        $this->deriveMessageData($event, $user, $match);
        $units = $event->getSubject()->units;

        // Get all territories in path
        $territory_path_ids = $event->getSubject()->path;
        $territory_path = $this->em->getRepository(Territory::class)->findBy(['id' => $territory_path_ids]);

        // Sort the territory paths by the order of the path
        $territory_path_order = array_flip($territory_path_ids);
        usort($territory_path, function($t1, $t2) use ($territory_path_order) {
            return $territory_path_order[$t1->getId()] > $territory_path_order[$t2->getId()];
        });

        $this->army_service->moveUnits($user, $match, $territory_path, $units);
    }

    public function attack($event) {
        $this->deriveMessageData($event, $user, $match);
        $units = $event->getSubject()->units;

        // Get all territories in path
        $territory_path_ids = $event->getSubject()->path;
        $territory_path = $this->em->getRepository(Territory::class)->findBy(['id' => $territory_path_ids]);

        // Sort the territory paths by the order of the path
        $territory_path_order = array_flip($territory_path_ids);
        usort($territory_path, function($t1, $t2) use ($territory_path_order) {
            return $territory_path_order[$t1->getId()] > $territory_path_order[$t2->getId()];
        });

        $attacking_territory = $territory_path[0];
        $defending_territory = $territory_path[1];

        $this->battle_service->attack($user, $match, $attacking_territory, $defending_territory, $units);
    }

    private function deriveMessageData($event, &$user, &$match, &$territory = null) {
        $message = $event->getSubject();
        $match_id = $message->match_id ?? null;
        $territory_id = $message->territory_id ?? null;

        $user = $event->getArgument('user') ?? null;
        $match = $match_id ? $this->em->find(Match::class, $match_id) : null;
        $territory = $territory_id ? $this->em->find(Territory::class, $territory_id) : null;
    }
}
