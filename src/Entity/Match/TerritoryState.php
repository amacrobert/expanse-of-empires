<?php

namespace App\Entity\Match;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use DateTime;
use App\Entity\Map\Territory;
use App\Entity\Match\{Building, Empire};
use JsonSerializable;

class TerritoryState implements JsonSerializable {

    private $id;
    private $match;
    private $empire;
    private $territory;
    private $building;
    private $fortification = 0;
    private $units;

    public function jsonSerialize() {
        return [];
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

    public function getUnits() {
        return [];
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
