<?php

namespace App\Entity\Match;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use DateTime;
use App\Entity\Map\Territory;

class TerritoryState {

    private $id;
    private $match;
    private $empire;
    private $territory;
    private $building;
    private $fortification = 0;
    private $armies;
    private $support = 0;

    public function __construct() {
        $this->armies = new ArrayCollection;
    }

    public function getSupport(): int {
        return $this->support;
    }

    public function setSupport(int $support): TerritoryState {
        $this->support = $support;
        return $this;
    }

    public function getArmies(): Collection {
        return $this->armies;
    }

    public function addArmy(Army $army): TerritoryState {
        $army->setTerritoryState($this);
        $this->armies[] = $army;
        return $this;
    }

    public function removeArmy(Army $army): TerritoryState {
        $army->setTerritoryState(null); // to trigger orphan removal
        $this->armies->removeElement($army);
        return $this;
    }

    public function getId(): ?int {
        return $this->id;
    }

    public function getMatch(): ?Match {
        return $this->match;
    }

    public function setMatch(?Match $match): TerritoryState {
        $this->match = $match;
        return $this;
    }

    public function getEmpire(): ?Empire {
        return $this->empire;
    }

    public function setEmpire(?Empire $empire): TerritoryState {
        $this->empire = $empire;
        return $this;
    }

    public function getTerritory(): ?Territory {
        return $this->territory;
    }

    public function setTerritory(?Territory $territory): TerritoryState {
        $this->territory = $territory;
        return $this;
    }

    public function getBuilding(): ?Building {
        return $this->building;
    }

    public function setBuilding(?Building $building): TerritoryState {
        $this->building = $building;
        return $this;
    }

    public function getFortification(): ?int {
        return $this->fortification;
    }

    public function setFortification(?int $fortification): TerritoryState {
        $this->fortification = $fortification;
        return $this;
    }
}
