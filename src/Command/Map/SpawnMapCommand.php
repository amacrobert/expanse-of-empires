<?php

namespace App\Command\Map;

use Symfony\Bundle\FrameworkBundle\Command\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Input\InputArgument;
use Doctrine\ORM\EntityManagerInterface;
use App\Entity\Map\{Map, Territory, Terrain};


class SpawnMapCommand extends ContainerAwareCommand {

    protected $em;

    public function __construct(EntityManagerInterface $em) {
        parent::__construct();

        $this->em = $em;
    }

    protected function configure() {
        $this
            ->setName('eoe:map:spawn')
            ->setDescription('Start the websocket api server.')
            ->addArgument('name', InputArgument::REQUIRED)
            ->addArgument('radius', InputArgument::REQUIRED)
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output) {

        $map = new Map;
        $map->setName($input->getArgument('name'));
        $this->em->persist($map);

        $radius = $input->getArgument('radius');

        $hexes = [];
        for($r = -$radius; $r <= $radius; $r++) {
            for($q = -($radius + $r); $q + $r <= $radius; $q++) {

                if ($q < -$radius || $q > $radius) {
                   continue;
                }

                $hexes[] = (object)[
                    'q' => $q,
                    'r' => $r
                ];
            }
        }

        foreach ($hexes as $hexLocation) {
            $territory = new Territory;
            $territory
                ->setMap($map)
                ->setAxialQ($hexLocation->q)
                ->setAxialR($hexLocation->r)
                ->setTerrain($this->em->getReference(Terrain::class, 1))
            ;
            $this->em->persist($territory);
        }

        $this->em->flush();
        $output->writeln('Map created. ID: ' . $map->getId());
    }
}
