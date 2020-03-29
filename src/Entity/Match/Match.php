<?php

namespace App\Entity\Match;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use JsonSerializable, DateTime, DateTimeInterface;
use App\Entity\Map\Map;

class Match implements JsonSerializable
{
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
    private $territory_states;
    private $date_last_resource_distribution;

    // unmapped
    private $user_empire = null;

    public function jsonSerialize() {
        $empire_count = $this->getEmpires()->count();
        $slots = $this->getMap()->getStartingTerritories()->count();

        return [
            'id'                => $this->getId(),
            'name'              => $this->getName(),
            'speed'             => $this->getSpeed(),
            'date_registration' => $this->getDateRegistration()->format('Y-m-d H:i:s T'),
            'date_npc'          => $this->getDateNPC()->format('Y-m-d H:i:s T'),
            'date_p2p'          => $this->getDateP2P()->format('Y-m-d H:i:s T'),
            'date_completed'    => $this->getDateCompleted() ? $this->getDateCompleted()->format('Y-m-d H:i:s T') : null,
            'completed'         => $this->getDateCompleted() ? true : false,
            'phase'             => $this->getPhase(),
            'map_name'          => $this->getMap() ? $this->getMap()->getName() : 'Map not chosen yet',
            'user_joined'       => (bool)$this->getUserEmpire(),
            'empire_count'      => $empire_count,
            'slots'             => $slots,
            'full'              => !($empire_count < $slots)
        ];
    }

    public function __toString() {
        return $this->getName() ?: 'New Match';
    }

    public function __construct() {
        $this->empires = new ArrayCollection;
    }

    public function getPhase() {
        $now = new DateTime;

        if ($this->getDateCompleted()) {
            $phase = 'complete';
        }
        else if ($now <= $this->getDateRegistration()) {
            $phase = 'pre-registration';
        }
        else if ($this->getDateRegistration() <= $now && $now < $this->getDateNPC()) {
            $phase = 'registration';
        }
        else if ($this->getDateNPC() <= $now && $now < $this->getDateP2P()) {
            $phase = 'non-player-combat';
        }
        else if ($this->getDateP2P() <= $now) {
            $phase = 'expanse-of-empires';
        }
        else {
            throw new \Exception('Match ' . $this->getId() . ' timeline is out of order');
        }

        return $phase;
    }

    public function getUserEmpire(): ?Empire {
        return $this->user_empire;
    }

    public function setUserEmpire(?Empire $user_empire) {
        $this->user_empire = $user_empire;
        return $this;
    }

    public function getDateLastResourceDistribution(): ?DateTimeInterface {
        return $this->date_last_resource_distribution;
    }

    public function setDateLastResourceDistribution(?DateTimeInterface $date): Match {
        $this->date_last_resource_distribution = $date;
        return $this;
    }

    public function getId() {
        return $this->id;
    }

    public function getTerritoryStates(): ?Collection {
        return $this->territory_states;
    }

    public function addTerritoryState(TerritoryState $ts): Match {
        $ts->setMatch($this);
        $this->territory_states->add($ts);
        return $this;
    }

    public function removeTerritoryState(TerritoryState $ts): Match {
        $ts->setMatch(null);
        $this->territory_states->removeElement($ts);
        return $this;
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

    public function getMap(): ?Map {
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

    public function getDateRegistration(): ?DateTimeInterface {
        return $this->date_registration;
    }

    public function setDateRegistration(?DateTimeInterface $date_registration) {
        $this->date_registration = $date_registration;
        return $this;
    }

    public function getDateNPC(): ?DateTimeInterface {
        return $this->date_npc;
    }

    public function setDateNPC(?DateTimeInterface $date_npc) {
        $this->date_npc = $date_npc;
        // Set resources to start accumulating once registration phase ends
        if (!$this->date_last_resource_distribution || $this->date_last_resource_distribution < $date_npc) {
            $this->setDateLastResourceDistribution($date_npc);
        }
        return $this;
    }

    public function getDateP2P(): ?DateTimeInterface {
        return $this->date_p2p;
    }

    public function setDateP2P(?DateTimeInterface $date_p2p) {
        $this->date_p2p = $date_p2p;
        return $this;
    }

    public function getDateCompleted(): ?DateTimeInterface {
        return $this->date_completed;
    }

    public function setDateCompleted(DateTimeInterface $date_completed) {
        $this->date_completed = $date_completed;
        return $this;
    }

    public function getEmpires(): Collection {
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
