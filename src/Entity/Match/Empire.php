<?php

namespace App\Entity\Match;

use App\Entity\User\User;
use App\Entity\Map\Territory;
use Doctrine\Common\Collections\ArrayCollection;
use JsonSerializable;
use DateTime;

class Empire implements JsonSerializable {

    private $id;
    private $user;
    private $match;
    private $date_founded;
    private $capital;
    private $active = true;
    private $result;
    private $placement;
    private $color;
    private $supply = 0;
    private $tide = 0;

    public function jsonSerialize() {
        return [
            'id'                => $this->getId(),
            'username'          => $this->getUser()->getUsername(),
            'user_id'           => $this->getUser()->getId(),
            'result'            => $this->getResult(),
            'date_founded'      => $this->getDateFounded(),
            'active'            => $this->isActive(),
            'result'            => $this->getResult(),
            'placement'         => $this->getPlacement(),
            'color'             => $this->getColor(),
            'territory_count'   => $this->territory_count ?? null,
            'capital_id'        => $this->getCapital()->getId(),
        ];
    }

    public function getId(): ?int {
        return $this->id;
    }

    public function getCapital(): ?Territory {
        return $this->capital;
    }

    public function setCapital(?Territory $capital): self {
        $this->capital = $capital;
        return $this;
    }

    public function getColor(): ?string {
        return $this->color;
    }

    public function setColor(?string $color): self {
        $this->color = $color;
        return $this;
    }

    public function getSupply(): ?float {
        return $this->supply ?: 0;
    }

    public function setSupply(float $supply): self {
        $this->supply = $supply;
        return $this;
    }

    public function getTide(): ?float {
        return $this->tide ?: 0;
    }

    public function setTide(float $tide): self {
        $this->tide = $tide;
        return $this;
    }

    public function getUser(): User {
        return $this->user;
    }

    public function setUser(User $user): self {
        $this->user = $user;
        return $this;
    }

    public function getMatch(): Match {
        return $this->match;
    }

    public function setMatch(Match $match): self {
        $this->match = $match;
        return $this;
    }

    public function getDateFounded(): DateTime {
        return $this->date_founded;
    }

    public function setDateFounded(DateTime $date_founded): self {
        $this->date_founded = $date_founded;
        return $this;
    }

    public function setDateFoundedToNow(): self {
        return $this->setDateFounded(new DateTime);
    }

    public function isActive(): bool {
        return (bool)$this->active;
    }

    public function setActive(bool $active): self {
        $this->$active = $active;
        return $this;
    }

    public function getResult(): ?string {
        return $this->result;
    }

    public function setResult(?string $result): self {
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
