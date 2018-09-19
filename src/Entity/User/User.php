<?php

namespace App\Entity\User;

use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Validator\Constraints as Assert;
use JsonSerializable;

class User implements UserInterface, JsonSerializable {

    private $id;

    /**
     * @Assert\Length(min=4)
     * @Assert\Length(max=24)
     */
    private $username;

    /**
     * @Assert\Email(
     *     message = "Please enter a valid email",
     *     checkMX = true
     * )
     */
    private $email;
    private $password;
    private $date_registered;
    private $api_key;
    private $validated = false;

    // Not mapped
    /**
     * @Assert\Length(min=6)
     */
    private $plain_password;

    public function jsonSerialize() {
        return [
            'id' => $this->getId(),
            'username' => $this->getUsername(),
        ];
    }

    public function getRoles() {

        if ($this->getId() == 1) {
            return ['ROLE_USER', 'ROLE_ADMIN'];
        }

        return ['ROLE_ADMIN'];
    }

    public function isValidated() {
        return $this->validated;
    }

    public function setValidated($validated) {
        $this->validated = $validated;
        return $this;
    }

    public function getApiKey(): ?string {
        return $this->api_key;
    }

    public function setApiKey(?string $api_key) {
        $this->api_key = $api_key;
        return $this;
    }

    public function getSalt() {
        return null;
    }

    public function eraseCredentials() {
        $this->plain_password = null;
        return $this;
    }

    public function getId() {
        return $this->id;
    }

    public function getUsername() {
        return $this->username;
    }

    public function setUsername($username) {
        $this->username = $username;
        return $this;
    }

    public function getEmail() {
        return $this->email;
    }

    public function setEmail($email) {
        $this->email = $email;
        return $this;
    }

    public function getPassword() {
        return $this->password;
    }

    public function setPassword($password) {
        $this->password = $password;
        return $this;
    }

    public function getDateRegistered() {
        return $this->date_registered;
    }

    public function setDateRegistered($date_registered) {
        $this->date_registered = $date_registered;
        return $this;
    }

    public function setDateRegisteredToNow() {
        return $this->setDateRegistered(new \DateTime);
    }

    public function getPlainPassword() {
        return $this->plain_password;
    }

    public function setPlainPassword($plain_password) {
        $this->plain_password = $plain_password;
        return $this;
    }
}
