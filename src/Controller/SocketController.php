<?php

namespace App\Controller;

use Ratchet\ConnectionInterface;
use Ratchet\MessageComponentInterface;
use Symfony\Component\EventDispatcher\EventDispatcherInterface;
use Symfony\Component\EventDispatcher\GenericEvent;
use Doctrine\ORM\EntityManagerInterface;
use App\Entity\User;

class SocketController implements MessageComponentInterface {

    protected $dispatcher;
    protected $em;
    protected $connections = [];
    protected $connections_by_match = [];
    protected $verbose = false;

    public function __construct(EventDispatcherInterface $dispatcher, EntityManagerInterface $em, $verbose = false) {
        $this->dispatcher = $dispatcher;
        $this->verbose = $verbose;
        $this->em = $em;
    }

    public function onOpen(ConnectionInterface $connection) {
        $this->connections[] = $connection;
        echo '[' . date('c') . '] New connection' . PHP_EOL;
    }

    public function onMessage(ConnectionInterface $from_connection, $message) {

        $message = json_decode($message);
        print_r($message) . PHP_EOL;

        $match_id = $message->match_id;
        if ($token = $message->token ?? null) {
            $user = $this->em->getRepository(\App\Entity\User::class)->findOneBy([
                'api_key' => $token
            ]);
        }

        if (empty($user)) {
            $user = new User;
            $user->setUsername('Anonymous');
        }

        $user_id = $user->getId() ?? 'anon';

        if ($message->action == 'iam') {

            if (!isset($this->connections_by_match[$match_id])) {
                $this->connections_by_match[$match_id] = [];

                if (!isset($this->connections_by_match[$match_id][$user_id])) {
                    $this->connections_by_match[$match_id][$user_id] = [];
                }
            }

            $this->connections_by_match[$match_id][$user_id][] = $from_connection;

            if ($user->getId()) {
                $this->broadcastToMatch($match_id, [
                    'action' => 'chat-join',
                    'user' => $user,
                ]);
            }
        }

        $event = new GenericEvent($message, ['user' => $user]);

        if ($message->action == 'chat-send') {
            $this->dispatcher->dispatch('socket.chat.send', $event);
        }

        //exit();
    }

    public function onClose(ConnectionInterface $closed_connection) {
        foreach ($this->connections as $key => $connection) {
            if ($closed_connection === $connection) {
                unset($this->connections[$key]);
                echo '[' . date('c') . '] Connection closed' . PHP_EOL;
                break;
            }
        }
    }

    public function onError(ConnectionInterface $connection, \Exception $e) {
        if ($this->verbose) {
            print (string)$e;
        }
        else {
            print
                get_class($e) .
                ': ' . $e->getMessage() .
                ' in ' . $e->getFile() .
                ' on line ' . $e->getLine() .
                PHP_EOL
            ;
        }

        $connection->send('Server Error');
        $connection->close();
    }

    public function broadcastToMatch($match_id, $message, $exclude_user_ids = []) {
        $user = $message['user'];
        $message = json_encode($message);

        foreach ($this->connections_by_match[$match_id] as $user_connections) {
            foreach ($user_connections as $user_id => $connection) {
                if (!in_array($user_id, $exclude_user_ids)) {
                    $connection->send($message);
                }
            }
        }
    }
}
