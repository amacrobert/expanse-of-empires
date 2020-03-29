<?php

namespace App\Entity\Match;
use DateTime, JsonSerializable;

class Intel implements JsonSerializable
{
    private $id;
    private $empire;
    private $territory_state;
    private $army_empire;
    private $size = 0;
    private $date;

    public function jsonSerialize() {
        return [
            'id'                => $this->getId(),
            'army_empire_id'    => $this->getArmyEmpire()->getId(),
            'size'              => $this->getSize(),
            'date'              => $this->getDate()->format('Y-m-d H:i:s T'),
        ];
    }

    public function getId(): ?int {
        return $this->id;
    }

    public function getEmpire(): ?Empire {
        return $this->empire;
    }

    public function setEmpire(Empire $empire): self {
        $this->empire = $empire;
        return $this;
    }

    public function getTerritoryState(): ?TerritoryState {
        return $this->territory_state;
    }

    public function setTerritoryState(TerritoryState $state): self {
        $this->territory_state = $state;
        return $this;
    }

    public function getArmyEmpire(): ?Empire {
        return $this->army_empire;
    }

    public function setArmyEmpire(?Empire $army_empire): self {
        // null means NPC
        $this->army_empire = $army_empire;
        return $this;
    }

    public function getSize(): int {
        return $this->size;
    }

    public function setSize(int $size): self {
        $this->size = $size;
        return $this;
    }

    public function getDate(): ?DateTime {
        return $this->date;
    }

    public function setDate(DateTime $date): self {
        $this->date = $date;
        return $this;
    }

    public function setDateToNow(): self {
        return $this->setDate(new DateTime);
    }
}
