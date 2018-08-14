<?php

namespace App\Entity\Map;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use JsonSerializable;
use App\Entity\Match\{Building, TerritoryState};

class Territory implements JsonSerializable {

    protected $id;
    protected $map;
    protected $terrain;
    protected $axial_r;
    protected $axial_q;
    protected $starting_position = false;
    protected $initial_building;
    protected $initial_fortification = 0;

    // unmapped -- derived from TerritoryState
    public $empire_id;
    public $building;
    public $fortification;
    public $units;

    public function jsonSerialize() {
        return [
            'id'                => $this->getId(),
            'q'                 => $this->getAxialQ(),
            'r'                 => $this->getAxialR(),
            'coordinates'       => $this->getCoordinates(),
            'terrain'           => $this->getTerrain(),
            'starting_position' => $this->isStartingPosition(),
            'empire_id'         => $this->empire_id ?: null,
            'building'          => $this->building ?: null,
            'fortification'     => $this->fortification ?: 0,
            'units'             => $this->units ?: [],
        ];
    }

    public function getId(): ?int {
        return $this->id;
    }

    public function setState(?TerritoryState $state): Territory {
        if (!$state) {
            $this->empire_id = $this->building = null;
            $this->fortification = 0;
            $this->units = [];
        }

        $empire = $state->getEmpire();
        $this->empire_id = $empire ? $empire->getId() : null;
        $this->building = $state->getBuilding();
        $this->fortification = $state->getFortification();
        $this->units = $state->getUnits();

        return $this;
    }

    public function getInitialBuilding(): ?Building {
        return $this->building;
    }

    public function setInitialBuilding(?Building $building): Map {
        $this->building = $building;
        return $this;
    }

    public function getInitialFortification(): ?int {
        return $this->initial_fortification;
    }

    public function setInitialFortification(?int $fortification): Territory {
        $this->initial_fortification = $fortification;
        return $this;
    }

    public function getMap(): ?Map {
        return $this->map;
    }

    public function setMap(?Map $map) {
        $this->map = $map;
        return $this;
    }

    public function getTerrain(): ?Terrain {
        return $this->terrain;
    }

    public function setTerrain(?Terrain $terrain) {
        $this->terrain = $terrain;
        return $this;
    }

    public function isStartingPosition(): ?bool {
        return (bool)$this->starting_position;
    }

    public function setStartingPosition(bool $starting_position) {
        $this->starting_position = $starting_position;
        return $this;
    }

    public function getAxialR(): ?int {
        return $this->axial_r;
    }

    public function getAxialQ(): ?int {
        return $this->axial_q;
    }

    public function setAxialR(?int $r) {
        $this->axial_r = $r;
        return $this;
    }

    public function setAxialQ(?int $q) {
        $this->axial_q = $q;
        return $this;
    }

    public function getCoordinates() {
        return [
            'r' => $this->getAxialR(),
            'q' => $this->getAxialQ(),
        ];
    }
}
