<?php

namespace App\Entity\Match;

use Doctrine\Common\Collections\ArrayCollection;
use JsonSerializable;
use DateTime;

class Match implements JsonSerializable {

    private $id;
    private $visible = true;
    private $name;
    private $map;
    private $speed;
    private $date_registration;
    private $date_npc;
    private $date_p2p;
    private $date_completed;
    private $empires;

    // unmapped
    private $user_empire = null;

    public function jsonSerialize() {
        return [
            'id'                => $this->getId(),
            'name'              => $this->getName(),
            'speed'             => $this->getSpeed(),
            'date_registration' => $this->getDateRegistration(),
            'date_npc'          => $this->getDateNPC(),
            'date_p2p'          => $this->getDateP2P(),
            'date_completed'    => $this->getDateCompleted(),
            'completed'         => $this->getDateCompleted() ? true : false,
        ];
    }

    public function __toString() {
        return $this->getName() ?: 'New Match';
    }

    public function __construct() {
        $this->empires = new ArrayCollection;
    }

    public function getId() {
        return $this->id;
    }

    public function isVisible(): bool {
        return (bool)$this->visible;
    }

    public function setVisible($visible) {
        $this->visible = $visible;
        return $this;
    }

    public function getName(): ?string {
        return $this->name;
    }

    public function setName($name) {
        $this->name = $name;
        return $this;
    }

    public function getMap(): Map {
        return $this->map;
    }

    public function setMap(?Map $map) {
        $this->map = $map;
        return $this;
    }

    public function getSpeed(): ?int {
        return $this->speed;
    }

    public function setSpeed($speed) {
        $this->speed = $speed;
        return $this;
    }

    public function getDateRegistration(): ?DateTime {
        return $this->date_registration;
    }

    public function setDateRegistration(?DateTime $date_registration) {
        $this->date_registration = $date_registration;
        return $this;
    }

    public function getDateNPC(): ?DateTime {
        return $this->date_npc;
    }

    public function setDateNPC(?DateTime $date_npc) {
        $this->date_npc = $date_npc;
        return $this;
    }

    public function getDateP2P(): ?DateTime {
        return $this->date_p2p;
    }

    public function setDateP2P(?DateTime $date_p2p) {
        $this->date_p2p = $date_p2p;
        return $this;
    }

    public function getDateCompleted(): ?DateTime {
        return $this->date_completed;
    }

    public function setDateCompleted(DateTime $date_completed) {
        $this->date_completed = $date_completed;
        return $this;
    }

    public function getEmpires(): ArrayCollection {
        return $this->empires;
    }

    public function addEmpire(Empire $empire) {
        $empire->setMatch($this);
        $this->empires[] = $empire;
        return $this;
    }

    public function removeEmpire(Empire $empire) {
        $empire->setMatch(null);
        $this->empires->removeElement($empire);
        return $this;
    }
}
