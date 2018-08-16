<?php

namespace App\Controller;

use Ratchet\ConnectionInterface;
use Ratchet\MessageComponentInterface;
use Symfony\Component\EventDispatcher\EventDispatcherInterface;
use Symfony\Component\EventDispatcher\GenericEvent;
use Doctrine\ORM\EntityManagerInterface;
use App\Entity\User\User;
use Exception;

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

    public function broadcastToMatch($match_id, $message, $exclude_user_ids = []) {

        print 'Sending: ' . json_encode($message) . PHP_EOL;
        $message = json_encode($message);

        foreach ($this->connections_by_match[$match_id] as $user_connections) {
            foreach ($user_connections as $user_id => $connection) {
                if (!in_array($user_id, $exclude_user_ids)) {
                    $connection->send($message);
                }
            }
        }
    }

    public function broadcastToUser($match_id, $user_id, $message) {
        //
    }

    public function onOpen(ConnectionInterface $connection) {
        $this->connections[] = $connection;
        echo '[' . date('c') . '] New connection' . PHP_EOL;
    }

    public function onMessage(ConnectionInterface $from_connection, $message) {

        print 'Received: ' . $message . PHP_EOL;
        $message = json_decode($message);

        $match_id = $message->match_id;
        if ($token = $message->token ?? null) {
            $user = $this->em->getRepository(User::class)->findOneBy([
                'api_key' => $token
            ]);
        }

        if (empty($user)) {
            $user = new User;
            $user->setUsername('Anonymous');
        }

        $user_id = $user->getId() ?? 'anon';

        // Add user to connection list if not already in it
        if (!isset($this->connections_by_match[$match_id])) {
            $this->connections_by_match[$match_id] = [];

        }
        if (!isset($this->connections_by_match[$match_id][$user_id])) {
            $this->connections_by_match[$match_id][$user_id] = [];
        }
        if (!in_array($from_connection, $this->connections_by_match[$match_id][$user_id])) {
            print "ADDING CONNECTION\n";
            $this->connections_by_match[$match_id][$user_id][] = $from_connection;
        }

        // 'iam' messages are just a user announcing their presence
        if ($message->action == 'iam') {
            if ($user->getId()) {
                $this->broadcastToMatch($match_id, [
                    'action' => 'chat-join',
                    'user' => $user,
                ]);
            }
        }
        // All other messages received go to the event handler.
        else {
            $event = new GenericEvent($message, ['user' => $user]);
            $event_name = 'socket.' . str_replace('-', '.', $message->action);
            try {
                $this->dispatcher->dispatch($event_name, $event);
            }
            catch (Exception $e) {
                // TODO: Broadcast error to user
                print $e->getMessage() . PHP_EOL;
                //print $e->getTraceAsString();
            }
        }
    }

    public function onClose(ConnectionInterface $closed_connection) {
        foreach ($this->connections as $key => $connection) {
            if ($closed_connection === $connection) {
                unset($this->connections[$key]);
                echo 'CONNECTION CLOSED' . PHP_EOL;
                break;
            }
        }
    }

    public function onError(ConnectionInterface $connection, Exception $e) {
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
}
