<?php

namespace App\Exception;

use Exception;

class RegistrationException extends Exception {

    public $registration_errors = [];

    public function __construct($errors) {
        $this->setRegistrationErrors($errors);
    }

    public function getRegistrationErrors() {
        return $this->registration_errors;
    }

    public function setRegistrationErrors($errors) {
        $this->registration_errors = $errors;
        return $this;
    }

    public function addRegistrationError($error) {
        $this->registration_errors[] = $error;
    }
}
