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
            'name'              => $this->getName(),
            'description'       => $this->getDescription(),
            'state'             => $this->getTerritories()->toArray(),
        ];
    }

    public function __construct() {
        $this->territories = new ArrayCollection;
    }

    public function __toString() {
        return $this->getName() ?: 'New Map';
    }

    public function getId() {
        return $this->id;
    }

    public function getName(): ?string {
        return $this->name;
    }

    public function setName(?string $name): Map {
        $this->name = $name;
        return $this;
    }

    public function getDescription(): ?string {
        return $this->description;
    }

    public function setDescription(?string $description): Map {
        $this->description = $description;
        return $this;
    }

    public function getTerritories(): ?Collection {
        return $this->territories;
    }

    public function getTerritoriesById(): ?array {
        $territories = $this->getTerritories()->toArray();
        $territories_by_id = [];

        foreach ($territories as $territory) {
            $territories_by_id[$territory->getId()] = $territory;
        }

        return $territories_by_id;
    }

    public function addTerritory(?Territory $territory): Map {
        $this->territories[] = $territory;
        $territory->setMap($this);
        return $this;
    }

    public function removeTerritory(?Territory $territory): Map {
        $this->territories->removeElement($territory);
        $territory->setMap(null);
        return $this;
    }
}
