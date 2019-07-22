<?php

namespace App\Command\Match;

use Symfony\Bundle\FrameworkBundle\Command\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Input\InputArgument;
use Doctrine\ORM\EntityManagerInterface;
use App\Entity\Match\Match;
use App\Entity\Map\{Map, Territory, Terrain};
use DateTime;

use App\Service\Socket\SocketClient;

class DistributeResourcesCommand extends ContainerAwareCommand {

    protected $em;

    const BASE_TIDE = 600;
    const TIDE_PER_TERRITORY = 2;

    const UPDATE_DISTRIBUTION_DATE = "
        UPDATE `match`
        SET date_last_resource_distribution = :now
        WHERE id = :match_id
    ";
    const ADD_RESOURCES_TO_EMPIRE = "
        UPDATE empire
        SET supply = (empire.supply + :new_supply), tide = (empire.tide + :new_tide)
        WHERE id = :empire_id
    ";

    public function __construct(EntityManagerInterface $em) {
        $this->em = $em;
        $this->pdo = $this->em->getConnection()->getWrappedConnection();
        $this->add_supply_statement = $this->pdo->prepare(self::ADD_RESOURCES_TO_EMPIRE);
        $this->update_distribution_date_statement = $this->pdo->prepare(self::UPDATE_DISTRIBUTION_DATE);

        parent::__construct();
    }

    protected function configure() {
        $this
            ->setName('eoe:match:distribute-resources')
            ->setDescription('Distribute supply and tide owed to empires since the last distribution')
        ;
    }

    protected function execute(
        InputInterface $input,
        OutputInterface $output)
    {
        // Select every income-earning territory
        $sql = "
            SELECT
                match.id AS match_id,
                empire.id AS empire_id,
                empire.user_id,
                match.date_last_resource_distribution AS last_supply,
                empire.supply AS old_supply,
                empire.tide AS old_tide,
                territory_id,
                building_id,
                speed,
                terrain.`name`,
                base_tide_cost,
                base_supply_output
            FROM
                territory_state state
                JOIN empire ON state.empire_id = empire.id
                JOIN `match` ON empire.match_id = `match`.id
                JOIN territory ON state.territory_id = territory.id
                JOIN terrain ON territory.terrain_id = terrain.id
                JOIN user ON empire.user_id = user.id
            WHERE
                state.empire_id IS NOT NULL
                AND `match`.date_completed IS NULL
                AND `match`.date_npc <= NOW()
                AND empire.result IS NULL
            ;
        ";

        $rows = $this->pdo->query($sql)->fetchAll(\PDO::FETCH_ASSOC);

        // last_distribution[match_id] => date
        $last_distribution = [];
        // income[match_id][empire_id] => [new_supply, new_tide, old_supply, old_tide, user_id]
        $income = [];

        if (empty($rows)) {
            $output->writeln('No qualifying distributions');
            return;
        }

        foreach ($rows as $row) {
            extract($row); // match_id, empire_id, user_id, pld_supply, old_tide, last_supply, territory_id, building_id, speed, name, base_tide_cost, base_supply_output

            if (!isset($last_distribution[$match_id])) {
                $last_distribution[$match_id] = new DateTime($last_supply);
            }

            if (!isset($income[$match_id])) {
                $income[$match_id] = [];
            }

            if (!isset($income[$match_id][$empire_id])) {
                $income[$match_id][$empire_id] = [
                    'new_supply' => 0,
                    'new_tide' => self::BASE_TIDE,
                    'old_supply' => $old_supply,
                    'old_tide' => $old_tide,
                    'user_id' => $user_id,
                ];
            }

            $income[$match_id][$empire_id]['new_supply'] += $base_supply_output;
            $income[$match_id][$empire_id]['new_tide'] += self::TIDE_PER_TERRITORY;
        }
        $update_messages = [];
        foreach ($income as $match_id => $empires) {
            $now = new DateTime;
            $results = $this->distributeResourcesForMatch(
                $match_id,
                $empires,
                $last_distribution[$match_id],
                $now,
                $update_messages
            );

            $output->writeln(
                '[' . $now->format('Y-m-d H:i:s') . ']' .
                ' - Match ' . $match_id . ': ' .
                $results['total_distributed'] . ' supply to ' .
                $results['total_empires'] . ' empires ' .
                '(' . $results['seconds_since_last_supply'] . 's)'
            );

        }

        // Send batch of resource update messages to socket server for distribution to open connections
        \Ratchet\Client\connect('ws://127.0.0.1:8080')->then(function($conn) use ($update_messages) {
            $conn->send(json_encode([
                'action' => 'client-messages',
                'messages' => $update_messages,
            ]));
            $conn->close();
        }, function ($e) {
            echo "Could not connect: {$e->getMessage()}\n";
        });
    }

    private function distributeResourcesForMatch(
        $match_id,
        $empires,
        $last_distribution,
        $distribution_date,
        &$update_messages): array
    {
        // Make all resource distributions and distribution records a single transaction for each match
        $this->pdo->beginTransaction();

        $last_match_distribution_timestamp = $last_distribution->getTimestamp();
        $seconds_since_last_supply = $distribution_date->getTimestamp() - $last_match_distribution_timestamp;

        $total_empires = 0;
        $total_distributed = 0;

        foreach ($empires as $empire_id => $resources) {
            $new_supply = $resources['new_supply'] * $seconds_since_last_supply / 3600;
            $new_tide = $resources['new_tide'] * $seconds_since_last_supply / 3600;
            $total_distributed += $new_supply;
            $total_empires++;

            $this->add_supply_statement->execute([
                'new_supply' => $new_supply,
                'new_tide' => $new_tide,
                'empire_id' => $empire_id,
            ]);

            $update_messages[] = [
                'action'    => 'resources-distributed',
                'match_id'  => $match_id,
                'user_id'   => $resources['user_id'],
                'updates' => [
                    'resources' => [
                        'supply'    => $new_supply + $resources['old_supply'],
                        'tide'      => $new_tide + $resources['old_tide'],
                    ],
                ],
            ];
        }

        $this->update_distribution_date_statement->execute([
            'now' => $distribution_date->format('Y-m-d H:i:s'),
            'match_id' => $match_id,
        ]);

        // Commit the transaction
        $this->pdo->commit();

        return [
            'total_distributed' => $total_distributed,
            'total_empires' => $total_empires,
            'seconds_since_last_supply' => $seconds_since_last_supply,
        ];
    }
}
