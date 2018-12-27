<?php

namespace App\Command\Server;

use Ratchet\Http\HttpServer;
use Ratchet\Server\IoServer;
use Ratchet\WebSocket\WsServer;
use Symfony\Bundle\FrameworkBundle\Command\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use App\Controller\SocketController;

class WebsocketServerCommand extends ContainerAwareCommand {

    protected $dispatcher;

    public function __construct(SocketController $socket_controller) {
        parent::__construct();

        $this->socket_controller = $socket_controller;
    }

    protected function configure() {
        $this
            ->setName('eoe:websocket:start')
            ->setDescription('Start the websocket api server.')
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output) {
        $output->writeln('Starting websocket server');
        $container = $this->getContainer();
        $verbose = $input->getOption('verbose');

        $websocket_server = new WsServer($this->socket_controller);
        $http_server = new HttpServer($websocket_server);
        $server = IoServer::factory($http_server, 8080);

        $server->run();
    }
}
