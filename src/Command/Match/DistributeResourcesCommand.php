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

class DistributeResourcesCommand extends ContainerAwareCommand {

    protected $em;

    const UPDATE_DISTRIBUTION_DATE = "
        UPDATE `match`
        SET date_last_resource_distribution = :now
        WHERE id = :match_id
    ";
    const ADD_SUPPLY_TO_EMPIRE = "
        UPDATE empire
        SET supply = (empire.supply + :new_supply)
        WHERE id = :empire_id
    ";

    public function __construct(EntityManagerInterface $em) {
        $this->em = $em;
        parent::__construct();
    }

    protected function configure() {
        $this
            ->setName('eoe:match:distribute-resources')
            ->setDescription('Distribute supply and tide owed to empires since the last distribution')
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output) {
        $pdo = $this->em->getConnection()->getWrappedConnection();

        // Select every income-earning territory
        $sql = "
            SELECT
                match.id AS match_id,
                empire.id AS empire_id,
                match.date_last_resource_distribution AS last_supply,
                empire.supply,
                empire.tide,
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
            WHERE
                state.empire_id IS NOT NULL
                AND `match`.date_completed IS NULL
                AND `match`.date_npc <= NOW()
                AND empire.result IS NULL
            ;
        ";

        $rows = $pdo->query($sql)->fetchAll(\PDO::FETCH_ASSOC);

        // last_distribution[match_id] => date
        $last_distribution = [];
        // supply_income[match_id][empire_id] => float
        $supply_income = [];

        foreach ($rows as $row) {
            extract($row); // match_id, empire_id, territory_id, building_id, speed, name, base_supply_output

            if (!isset($last_distribution[$match_id])) {
                $last_distribution[$match_id] = new DateTime($last_supply);
            }

            if (!isset($supply_income[$match_id])) {
                $supply_income[$match_id] = [];
            }

            if (!isset($supply_income[$match_id][$empire_id])) {
                $supply_income[$match_id][$empire_id] = 0;
            }

            $supply_income[$match_id][$empire_id] += $base_supply_output;
        }

        $now = new DateTime;

        $add_supply_statement = $pdo->prepare(self::ADD_SUPPLY_TO_EMPIRE);
        $update_distribution_date_statement = $pdo->prepare(self::UPDATE_DISTRIBUTION_DATE);

        foreach ($supply_income as $match_id => $empires) {
            $last_match_distribution_timestamp = $last_distribution[$match_id]->getTimestamp();
            $seconds_since_last_supply = $now->getTimestamp() - $last_match_distribution_timestamp;

            $total_empires = 0;
            $total_distributed = 0;
            foreach ($empires as $empire_id => $supply_rate) {
                $new_supply = $supply_rate * $seconds_since_last_supply / 3600;
                $total_distributed += $new_supply;
                $total_empires++;
                $add_supply_statement->execute([
                    'new_supply' => $new_supply,
                    'empire_id' => $empire_id,
                ]);
            }

            $update_distribution_date_statement->execute([
                'now' => $now->format('Y-m-d H:i:s'),
                'match_id' => $match_id,
            ]);

            $output->writeln('[' . $now->format('Y-m-d H:i:s') . '] - Match ' . $match_id . ': ' . $total_distributed . ' supply to ' . $total_empires . ' empires (' . $seconds_since_last_supply . 's)');
        }
    }
}
