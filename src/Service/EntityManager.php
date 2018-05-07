<?php

namespace App\Service;

class EntityManager extends \Doctrine\ORM\EntityManager {

    public function __construct($connection, $configuration, $event_manager) {
        parent::__construct($connection, $configuration, $event_manager);
    }
}
