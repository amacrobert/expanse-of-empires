<?php

namespace App\Entity\Map;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use JsonSerializable;

class Territory implements JsonSerializable {

    protected $id;
    protected $map;
    protected $terrain;
    protected $axial_r;
    protected $axial_q;
    protected $starting_position;

    // unmapped -- varies by match
    protected $building;
    protected $empire;
    protected $fortification;

    public function jsonSerialize() {
        return [
            'coordinates' => $this->getCoordinates(),
            'terrain' => $this->getTerrain(),
        ];
    }

    public function getId(): ?int {
        return $this->id;
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
