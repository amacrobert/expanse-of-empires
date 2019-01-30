<?php

namespace App\Entity\Match;

use JsonSerializable;

class Building implements JsonSerializable {

    private $id;
    private $name;

    public function jsonSerialize() {
        return [
            'name'          => $this->getName(),
            'machine_name'  => $this->getMachineName(),
        ];
    }

    public function __toString() {
        return $this->getName() ?: 'New Building Type';
    }

    public function getId() {
        return $this->id;
    }

    public function getName(): ?string {
        return $this->name;
    }

    public function setName(?string $name): Building {
        $this->name = $name;
        return $this;
    }

    public function getMachineName(): ?string {
        return str_replace(' ', '-', strtolower($this->getName()));
    }
}
