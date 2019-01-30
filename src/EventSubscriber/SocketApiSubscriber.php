<?php

namespace App\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\GetResponseForExceptionEvent;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\KernelEvents;
use App\Service\Chat\ChatService;
use App\Service\Match\MatchService;
use App\Entity\Match\Match;
use App\Entity\Map\Territory;

class SocketApiSubscriber implements EventSubscriberInterface {

    private $em;
    private $chat_service;
    private $match_service;

    public function __construct(
        EntityManagerInterface $em,
        ChatService $chat_service,
        MatchService $match_service
    ) {
        $this->em = $em;
        $this->chat_service = $chat_service;
        $this->match_service = $match_service;
    }

    public static function getSubscribedEvents() {

        return [
            'socket.chat.send' =>       [['userSentChat']],
            'socket.iam' =>             [['userJoinedChat']],
            'socket.empire.start' =>    [['startEmpire']],
            'socket.train.army' =>      [['trainArmy']],
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
        $this->match_service->createEmpire($user, $match, $territory);
    }

    public function trainArmy($event) {
        $this->deriveMessageData($event, $user, $match, $territory);
        $this->match_service->trainArmy($user, $match, $territory);
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
