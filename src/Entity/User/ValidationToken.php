<?php

namespace App\Entity\User;

use DateTime;
use DateInterval;

class ValidationToken {

    const TOKEN_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVQXYZ0123456789';
    const EXPIRATION_TIME = 'P30D'; // Expires 30 days after creation

    protected $id;
    protected $user;
    protected $date_created;
    protected $date_expired;
    protected $token;

    public function __construct(?User $user) {
        $this->setUser($user);
    }

    public function getId() {
        return $this->id;
    }

    public function getUser(): ?User {
        return $this->user;
    }

    public function setUser(?User $user) {
        $this->user = $user;
        return $this;
    }

    public function getDateCreated(): ?DateTime {
        return $this->date_created;
    }

    public function setDateCreated(DateTime $date_created) {
        $this->date_created = $date_created;
        return $this;
    }

    public function getDateExpired(): ?DateTime {
        return $this->date_expired;
    }

    public function setDateExpired(DateTime $date_expired) {
        $this->date_expired = $date_expired;
        return $this;
    }

    public function getToken(): ?string {
        return $this->token;
    }

    public function generate() {
        $this->token = '';
        while (strlen($this->token) < 12) {
            $this->token .= self::TOKEN_CHARS[rand(0, strlen(self::TOKEN_CHARS) - 1)];
        }
        return $this;
    }

    public function prePersist() {
        $now = new DateTime;
        $this
            ->generate()
            ->setDateCreated(new DateTime)
            ->setDateExpired($now->add(new DateInterval(self::EXPIRATION_TIME)))
        ;
    }
}
