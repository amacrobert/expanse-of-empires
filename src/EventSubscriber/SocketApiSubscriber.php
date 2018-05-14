<?php

namespace App\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\GetResponseForExceptionEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use App\Service\Chat\ChatService;

class SocketApiSubscriber implements EventSubscriberInterface {

    protected $chat;

    public function __construct(ChatService $chat) {
        $this->chat = $chat;
    }

    public static function getSubscribedEvents() {

        return [
            'socket.chat.send' => [
                ['userSentChat']
            ],
        ];
    }

    public function userSentChat($event) {
        $this->chat->chatSent($event->getSubject(), $event->getArgument('user'));
    }
}
