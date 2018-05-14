<?php

namespace App\Server;

use Ratchet\ConnectionInterface;
use Ratchet\MessageComponentInterface;
use Symfony\Component\EventDispatcher\EventDispatcherInterface;
use Symfony\Component\EventDispatcher\GenericEvent;
use Doctrine\ORM\EntityManagerInterface;

class SocketApi implements MessageComponentInterface {

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
        $token = $message->token;
        $user = $this->em->getRepository(\App\Entity\User::class)->findOneBy([
            'api_key' => $token
        ]);

        if (!$user) {
            print 'user not found' . PHP_EOL;
            return;
        }

        if ($message->action == 'iam') {

            if (!isset($this->connections_by_match[$match_id])) {
                $this->connections_by_match[$match_id] = [];
            }

            $this->connections_by_match[$match_id][] = $from_connection;

            $this->broadcastToMatch($match_id, [
                'action' => 'chat-join',
                'user' => $user,
            ]);

            print $user->getUsername() . ' joined room ' . $match_id . PHP_EOL;
        }

        $event = new GenericEvent($message, ['user' => $user]);

        if ($message->action == 'chat-send') {
            $this->dispatcher->dispatch('socket.chat.send', $event);
        }
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

    public function broadcastToMatch($match_id, $message, $exclude_connections = []) {
        $message = json_encode($message);
        foreach ($this->connections_by_match[$match_id] as $connection) {
            if (!in_array($connection, $exclude_connections)) {
                $connection->send($message);
            }
        }
    }
}
