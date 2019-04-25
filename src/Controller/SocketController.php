<?php

namespace App\Controller;

use Ratchet\ConnectionInterface;
use Ratchet\MessageComponentInterface;
use Symfony\Component\EventDispatcher\EventDispatcherInterface;
use Symfony\Component\EventDispatcher\GenericEvent;
use Doctrine\ORM\EntityManagerInterface;
use App\Entity\User\User;
use App\Exception\VisibleException;
use Exception;

class SocketController implements MessageComponentInterface {

    protected $dispatcher;
    protected $em;
    protected $connections = [];
    protected $connections_by_match = [];
    protected $verbose = false;

    public function getConnections() {
        return $this->connections;
    }

    public function __construct(EventDispatcherInterface $dispatcher, EntityManagerInterface $em, $verbose = false) {
        $this->dispatcher = $dispatcher;
        $this->verbose = $verbose;
        $this->em = $em;
    }

    public function broadcastToMatch($match_id, $message, $exclude_user_ids = []) {

        $message = json_encode($message);
        print 'Sending: ' . $message . PHP_EOL;

        foreach ($this->connections_by_match[$match_id] as $user_connections) {
            foreach ($user_connections as $user_id => $connection) {
                if (!in_array($user_id, $exclude_user_ids)) {
                    $connection->send($message);
                }
            }
        }
    }

    public function broadcastToUser($match_id, $user_id, $message) {
        $message = json_encode($message);

        if (!empty($this->connections_by_match[$match_id][$user_id])) {
            foreach ($this->connections_by_match[$match_id][$user_id] as $connection) {
                print '[' . date('c') . '] Sending: ' . $message . PHP_EOL;
                $connection->send($message);
            }
        }

    }

    public function broadcastToConnection($connection, $message) {
        $message = json_encode($message);
        print '[' . date('c') . '] Sending: ' . $message . PHP_EOL;
        $connection->send($message);
    }

    public function onOpen(ConnectionInterface $connection) {
        $this->connections[] = $connection;
        print '[' . date('c') . '] New connection' . PHP_EOL;
    }

    public function onMessage(ConnectionInterface $from_connection, $message) {

        print 'Received: ' . $message . PHP_EOL;
        $message = json_decode($message);

        // 'client-messages' is a batch of messages to be delivered to users that might have open connections
        if ($message->action == 'client-messages') {
            foreach ($message->messages as $client_message) {
                $this->broadcastToUser($client_message->match_id, $client_message->user_id, $client_message);
                //$this->onMessage($from_connection, json_encode($client_message));
            }

            return;
        }

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
            $this->connections_by_match[$match_id][$user_id][] = $from_connection;
        }

        // All other messages received go to the event handler.
        $event = new GenericEvent($message, ['user' => $user]);
        $event_name = 'socket.' . str_replace('-', '.', $message->action);
        try {
            $this->dispatcher->dispatch($event_name, $event);
        }
        catch (VisibleException $e) {
            $this->broadcastToConnection($from_connection, [
                'action' => 'error',
                'message' => $e->getMessage(),
            ]);
            $this->em->clear();
        }
        catch(Exception $e) {
            print (string)$e;
        }
    }

    public function onClose(ConnectionInterface $closed_connection) {
        foreach ($this->connections as $key => $connection) {
            if ($closed_connection === $connection) {
                print '[' . date('c') . '] Connection closed' . PHP_EOL;
                unset($this->connections[$key]);
                break;
            }
        }

        foreach ($this->connections_by_match as $match_id => $match_connections) {
            foreach ($match_connections as $user_id => $user_connections) {
                foreach ($user_connections as $index => $connection) {
                    if ($closed_connection === $connection) {
                        unset($this->connections_by_match[$match_id][$user_id][$index]);
                        break;
                    }
                }
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
