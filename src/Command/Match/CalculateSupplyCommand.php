<?php

namespace App\Command\Match;

use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use App\Service\Match\MatchService;
use Doctrine\ORM\EntityManagerInterface;
use App\Entity\Match\Match;

class CalculateSupplyCommand extends Command
{
    protected static $defaultName = 'eoe:match:calculate-supply';
    protected $em;
    protected $match_service;

    public function __construct(
        EntityManagerInterface $em,
        MatchService $ms)
    {
        $this->match_service = $ms;
        $this->em = $em;

        parent::__construct();
    }

    protected function configure()
    {
        $this
            ->setDescription('Calculate the supply for a match given its id')
            ->addArgument('match_id', InputArgument::REQUIRED, 'Match ID to calculate supply for')
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $match_id = $input->getArgument('match_id');

        $match = $this->em->find(Match::class, $match_id);

        var_dump($this->match_service->computeSupport($match));
    }
}
