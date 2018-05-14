<?php

namespace App\Command\Server;

use App\Server\SocketApi;
use Ratchet\Http\HttpServer;
use Ratchet\Server\IoServer;
use Ratchet\WebSocket\WsServer;
use Symfony\Bundle\FrameworkBundle\Command\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\EventDispatcher\EventDispatcherInterface;

class WebsocketServerCommand extends ContainerAwareCommand {

    protected $dispatcher;

    public function __construct(EventDispatcherInterface $dispatcher) {
        parent::__construct();

        $this->dispatcher = $dispatcher;
    }

    protected function configure() {
        $this
            ->setName('eoe:websocket:start')
            ->setDescription('Start the websocket api server.')
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output) {
        $container = $this->getContainer();
        $dispatcher = $this->dispatcher;
        $verbose = $input->getOption('verbose');

        //$socket_api = new SocketApi($this->dispatcher, $container, $verbose);
        $socket_api = $container->get(SocketApi::class);
        $websocket_server = new WsServer($socket_api);
        $http_server = new HttpServer($websocket_server);
        $server = IoServer::factory($http_server, 8080);

        $server->run();
    }
}
