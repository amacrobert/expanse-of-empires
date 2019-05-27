<?php

namespace App\Entity\Match;

use App\Entity\User\User;
use Doctrine\Common\Collections\ArrayCollection;
use JsonSerializable;
use DateTime;

class Empire implements JsonSerializable {

    private $id;
    private $user;
    private $match;
    private $date_founded;
    private $active = true;
    private $result;
    private $placement;
    private $color;
    private $supply = 0;
    private $tide = 0;

    public function jsonSerialize() {
        return [
            'username'          => $this->getUser()->getUsername(),
            'user_id'           => $this->getUser()->getId(),
            'result'            => $this->getResult(),
            'date_founded'      => $this->getDateFounded(),
            'active'            => $this->isActive(),
            'result'            => $this->getResult(),
            'placement'         => $this->getPlacement(),
            'color'             => $this->getColor(),
            'id'                => $this->getId(),
            'territory_count'   => $this->territory_count ?? null,
        ];
    }

    public function getId(): int {
        return $this->id;
    }

    public function getSupply(): ?float {
        return $this->supply ?: 0;
    }

    public function setSupply(float $supply): Empire {
        $this->supply = $supply;
        return $this;
    }

    public function getTide(): ?float {
        return $this->tide ?: 0;
    }

    public function setTide(float $tide): Empire {
        $this->tide = $tide;
        return $this;
    }

    public function getColor(): ?string {
        return $this->color;
    }

    public function setColor(?string $color): Empire {
        $this->color = $color;
        return $this;
    }

    public function getUser(): User {
        return $this->user;
    }

    public function setUser(User $user): Empire {
        $this->user = $user;
        return $this;
    }

    public function getMatch(): Match {
        return $this->match;
    }

    public function setMatch(Match $match): Empire {
        $this->match = $match;
        return $this;
    }

    public function getDateFounded(): DateTime {
        return $this->date_founded;
    }

    public function setDateFounded(DateTime $date_founded): Empire {
        $this->date_founded = $date_founded;
        return $this;
    }

    public function setDateFoundedToNow(): Empire {
        return $this->setDateFounded(new DateTime);
    }

    public function isActive(): bool {
        return (bool)$this->active;
    }

    public function setActive(bool $active): Empire {
        $this->$active = $active;
        return $this;
    }

    public function getResult(): ?string {
        return $this->result;
    }

    public function setResult(?string $result): Empire {
        $this->result = $result;
        return $this;
    }

    public function getPlacement(): ?int {
        return $this->placement;
    }

    public function setPlacement(?int $placement) {
        $this->placement = $placement;
        return $this;
    }
}
