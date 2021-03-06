<?php

namespace App\Entity\Match;

use \JsonSerializable;

class Army implements JsonSerializable {

    private $id;
    private $territory_state;
    private $empire;
    private $size = 0;

    public function jsonSerialize() {
        return [
            'empire_id' => $this->getEmpire() ? $this->getEmpire()->getId() : null,
            'size' => $this->getSize(),
        ];
    }

    public function getId(): ?int {
        return $this->id;
    }

    public function getTerritoryState(): ?TerritoryState {
        return $this->territory_state;
    }

    public function setTerritoryState(?TerritoryState $territory_state): Army {
        $this->territory_state = $territory_state;
        return $this;
    }

    public function getEmpire(): ?Empire {
        return $this->empire;
    }

    public function setEmpire(?Empire $empire): Army {
        $this->empire = $empire;
        return $this;
    }

    public function getSize(): int {
        return $this->size;
    }

    public function setSize(int $size): Army {
        $this->size = $size;
        return $this;
    }
}
