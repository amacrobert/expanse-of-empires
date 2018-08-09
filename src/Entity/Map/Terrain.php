<?php

namespace App\Entity\Map;
use JsonSerializable;

class Terrain implements JsonSerializable {

    protected $id;
    protected $name;
    protected $base_tide_cost;
    protected $base_supply_output;

    public function jsonSerialize() {
        return [
            'type'      => $this->getName(),
            'tide'      => $this->getBaseTideCost(),
            'supply'    => $this->getBaseSupplyOutput(),
        ];
    }

    public function __toString() {
        return $this->getName() ?: 'New Terrain';
    }

    public function getId(): ?int {
        return $this->id;
    }

    public function getName(): ?string {
        return $this->name;
    }

    public function setName(?string $name) {
        $this->name = $name;
    }

    public function getBaseTideCost(): ?int {
        return $this->base_tide_cost;
    }

    public function setBaseTideCost(?int $tide) {
        $this->base_tide_cost = $tide;
        return $this;
    }

    public function getBaseSupplyOutput(): ?int {
        return $this->base_supply_output;
    }

    public function setBaseSupplyOutput(?int $supply) {
        $this->base_supply_output = $supply;
        return $this;
    }
}
