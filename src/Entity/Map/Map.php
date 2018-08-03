<?php

namespace App\Entity\Map;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use JsonSerializable;

class Map implements JsonSerializable {

    protected $id;
    protected $name;
    protected $description;
    protected $territories;

    public function jsonSerialize() {
        return [
            'name'  => $this->getName(),
        ];
    }

    public function __construct() {
        $this->territories = new ArrayColleciton;
    }

    public function getId() {
        return $this->id;
    }

    public function getName(): ?string {
        return $this->name;
    }

    public function setName(?string $name) {
        $this->name = $name;
        return $this;
    }

    public function getDescription(): ?string {
        return $this->description;
    }

    public function setDescription(?string $description) {
        $this->description = $description;
        return $this;
    }

    public function getTerritories(): ?Collection {
        return $this->territories;
    }

    public function addTerritory(?Territory $territory) {
        $this->territories[] = $territory;
        $territory->setMap($this);
        return $this;
    }

    public function removeTerritory(?Territory $territory) {
        $this->territories->removeElement($territory);
        $territory->setMap(null);
        return $this;
    }
}
