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

    public function jsonSerialize() {
        return [
            'result'        => $this->getResult(),
            'date_founded'  => $this->getDateFounded(),
            'active'        => $this->isActive(),
            'result'        => $this->getResult(),
            'placement'     => $this->getPlacement(),
        ];
    }

    public function getId(): int {
        return $this->id;
    }

    public function getUser(): User {
        return $this->user;
    }

    public function setUser(User $user) {
        $this->user = $user;
        return $this;
    }

    public function getMatch(): Match {
        return $this->match;
    }

    public function setMatch(Match $match) {
        $this->match = $match;
        return $this;
    }

    public function getDateFounded(): DateTime {
        return $this->date_founded;
    }

    public function setDateFounded(DateTime $date_founded) {
        $this->date_founded = $date_founded;
        return $this;
    }

    public function isActive(): boolean {
        return (boolean)$this->active;
    }

    public function setActive(boolean $active) {
        $this->$active = $active;
        return $this;
    }

    public function getResult($result): string {
        return $this->result;
    }

    public function setResult(?string $result) {
        $this->result = $result;
        return $this;
    }

    public function getPlacement(): ?int {
        return $this->placement;
    }
}
