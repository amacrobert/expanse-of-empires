<?php

namespace App\Command\Match;

use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputOption;
use Doctrine\ORM\EntityManagerInterface;
use App\Entity\Match\{Match, TerritoryState, Empire, Intel};
use DateTimeImmutable, DateInterval;

use App\Service\Socket\SocketClient;

class ResetMatchCommand extends Command
{
    public function __construct(EntityManagerInterface $em) {
        $this->em = $em;
        parent::__construct();
    }

    protected function configure() {
        $this
            ->setName('eoe:match:reset')
            ->addArgument('match_id', InputArgument::REQUIRED, 'ID of match to reset')
            ->addOption('advance', 'a', InputOption::VALUE_NONE, 'If set, advance the phase to the next instead of clearing the match')
            ->setDescription('Manipulate a match for testing purposes.')
        ;
    }

    protected function execute(
        InputInterface $input,
        OutputInterface $output)
    {
        if (!$match = $this->em->getRepository(Match::class)->findOneById($match_id = $input->getArgument('match_id'))) {
            throw new \Exception('No match found with id "' . $match_id . '"');
        }

        if ($input->getOption('advance')) {

            $phase = $match->getPhase();
            $now = new DateTimeImmutable('UTC');

            switch ($phase) {
                case 'pre-registration':
                    $match
                        ->setDateRegistration($now)
                        ->setDateNPC($now->add(new DateInterval('P1D')))
                        ->setDateP2P($now->add(new DateInterval('P2D')));
                    break;

                case 'registration':
                    $match
                        ->setDateRegistration($now->sub(new DateInterval('P1D')))
                        ->setDateNPC($now)
                        ->setDateP2P($now->add(new DateInterval('P1D')));
                    break;

                case 'non-player-combat':
                    $match
                        ->setDateRegistration($now->sub(new DateInterval('P2D')))
                        ->setDateNPC($now->sub(new DateInterval('P1D')))
                        ->setDateP2P($now);
                    break;

                case 'expanse-of-empires':
                case 'complete':
                default:
                    $output->writeln('Cannot advance phase from ' . $phase);
                    exit();
            }

            $match->setDateLastResourceDistribution(null);
            $this->em->flush($match);

            $output->writeln('Advanced phase from <info>' . $phase . '</info> to <info>' . $match->getPhase() . '</info>');
            $output->writeln('New phase dates:');
            $output->writeln('- reg: ' . $match->getDateRegistration()->format('Y-m-d H:i:s T'));
            $output->writeln('- npc: ' . $match->getDateNPC()->format('Y-m-d H:i:s T'));
            $output->writeln('- p2p: ' . $match->getDateP2P()->format('Y-m-d H:i:s T'));

            return;
        }

        $connection = $this->em->getConnection();

        // reset the match and set phase to registration

        // reset intel
        $statement = $connection->prepare(self::DELETE_INTEL_SQL);
        $statement->execute(['match_id' => $match->getId()]);
        $output->writeln($statement->rowCount() . ' intel records deleted');

        // reset armies
        $statement = $connection->prepare(self::DELETE_ARMY_SQL);
        $statement->execute(['match_id' => $match->getId()]);
        $output->writeln($statement->rowCount() . ' army records deleted');

        // reset territory states
        $statement = $connection->prepare(self::DELETE_STATE_SQL);
        $statement->execute(['match_id' => $match->getId()]);
        $output->writeln($statement->rowCount() . ' territory_state records deleted');

        // reset empires
        $statement = $connection->prepare(self::DELETE_EMPIRE_SQL);
        $statement->execute(['match_id' => $match->getId()]);
        $output->writeln($statement->rowCount() . ' empire records deleted');

        // Reset match to registration phase
        $now = new DateTimeImmutable('UTC');
        $match
            ->setDateRegistration($now)
            ->setDateNPC($now->add(new DateInterval('P1D')))
            ->setDateP2P($now->add(new DateInterval('P2D')))
            ->setDateLastResourceDistribution(null);
        $this->em->flush($match);
        $output->writeln('New phase dates:');
        $output->writeln('- reg: ' . $match->getDateRegistration()->format('Y-m-d H:i:s T'));
        $output->writeln('- npc: ' . $match->getDateNPC()->format('Y-m-d H:i:s T'));
        $output->writeln('- p2p: ' . $match->getDateP2P()->format('Y-m-d H:i:s T'));

    }

    const DELETE_INTEL_SQL = "
        DELETE intel
        FROM intel
        JOIN empire ON intel.empire_id = empire.id
        WHERE empire.match_id=:match_id
    ";

    const DELETE_ARMY_SQL = "
        DELETE army
        FROM army
        JOIN territory_state ON army.territory_state_id = territory_state.id
        WHERE territory_state.match_id=:match_id
    ";

    const DELETE_STATE_SQL = "
        DELETE territory_state
        FROM territory_state
        WHERE territory_state.match_id=:match_id
    ";

    const DELETE_EMPIRE_SQL = "
        DELETE empire
        FROM empire
        WHERE empire.match_id=:match_id
    ";

}
