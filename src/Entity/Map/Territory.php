<?php

namespace App\Entity\Map;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use JsonSerializable;
use App\Entity\Match\{Building, TerritoryState, Intel};

class Territory implements JsonSerializable
{
    protected $id;
    protected $map;
    protected $terrain;
    protected $axial_r;
    protected $axial_q;
    protected $starting_position = false;
    protected $initial_building;
    protected $initial_fortification = 0;

    // unmapped -- hydrated by MatchService#hydrateMapState()
    private $state;
    private $intel;

    public function jsonSerialize()
    {
        $state = $this->getState();
        $intel = $this->getIntel();

        return [
            'id'                => $this->getId(),
            'q'                 => $this->getAxialQ(),
            'r'                 => $this->getAxialR(),
            'name'              => (string)$this,
            'coordinates'       => $this->getCoordinates(),
            'terrain'           => $this->getTerrain(),
            'starting_position' => $this->isStartingPosition(),
            'empire_id'         => $state && $state->getEmpire() ? $state->getEmpire()->getId() : null,
            'is_npc'            => !$state || !$state->getEmpire(),
            'building'          => $state ? $state->getBuilding() : null,
            'fortification'     => $state ? $state->getFortification() : 0,
            'armies'            => $state ? $state->getArmies()->toArray() : [],
            'intel'             => $intel ?: [],
            'support'           => $state ? $state->getSupport() : null,
        ];
    }

    public function __toString() {
        return '(' . $this->getAxialQ() . ', ' . $this->getAxialR() . ')';
    }

    public function getId(): ?int {
        return $this->id;
    }

    public function getState(): ?TerritoryState {
        return $this->state;
    }

    public function setState(?TerritoryState $state): Territory {
        $this->state = $state;
        return $this;
    }

    public function getIntel(): ?Intel {
        return $this->intel;
    }

    public function setIntel(?Intel $intel): self {
        $this->intel = $intel;
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
