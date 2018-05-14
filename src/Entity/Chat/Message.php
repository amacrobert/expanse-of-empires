<?php

namespace App\Entity\Chat;

use JsonSerializable;
use DateTime;
use App\Entity\User;
use App\Entity\Match\Match;

class Message implements JsonSerializable {

    protected $id;
    protected $user;
    protected $match;
    protected $message;
    protected $date_sent;

    public function jsonSerialize() {
        return [
            'id'        => $this->getId(),
            'user'      => $this->getUser(),
            'message'   => $this->getMessage(),
            'date_sent' => $this->getDateSent()->format('Y-m-d H:i:s T'),
        ];
    }

    public function getId(): ?int {
        return $this->id;
    }

    public function getUser(): ?User {
        return $this->user;
    }

    public function setUser(User $user) {
        $this->user = $user;
        return $this;
    }

    public function getMatch(): ?Match {
        return $this->match;
    }

    public function setMatch(?Match $match) {
        $this->match = $match;
        return $this;
    }

    public function getMessage(): string {
        return $this->message;
    }

    public function setMessage(string $message) {
        $this->message = $message;
    }

    public function getDateSent(): DateTime {
        return $this->date_sent;
    }

    public function setDateSent(DateTime $date_sent) {
        $this->date_sent = $date_sent;
        return $this;
    }

    public function setDateSentToNow() {
        return $this->setDateSent(new DateTime);
    }
}
