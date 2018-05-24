<?php

namespace App\Service\User;

use Symfony\Component\Security\Core\Encoder\UserPasswordEncoderInterface;
use Doctrine\ORM\EntityManagerInterface;
use App\Exception\RegistrationException;
use App\Entity\User;

class AuthService {

    const EMAIL_PATTERN = "/^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,})$/i";
    const API_KEY_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    protected $em;
    protected $encoder;

    public function __construct(EntityManagerInterface $em, UserPasswordEncoderInterface $encoder) {
        $this->em = $em;
        $this->encoder = $encoder;
    }

    public function register($email, $username, $plain_password) {

        $this->validateRegistration($email, $username, $plain_password);


        $user = new User;
        $password = $this->encoder->encodePassword($user, $plain_password);
        $api_key = $this->generateApiKey();

        $user
            ->setUsername($username)
            ->setEmail($email)
            ->setPassword($password)
            ->setApiKey($api_key)
        ;

        $this->em->persist($user);
        $this->em->flush($user);

        return [
            'user' => $user,
            'password' => $password,
            'api_key' => $api_key,
        ];
    }

    public function generateApiKey($length = 255) {
        $key = '';
        while (strlen($key) < $length) {
            $key .= self::API_KEY_CHARS[rand(0, strlen(self::API_KEY_CHARS) - 1)];
        }

        return $key;
    }

    private function validateRegistration($email, $username, $password) {

        $errors = [];

        // Validate email
        if (empty($email)) {
            $errors[] = 'Email address required';
        }
        else if (!preg_match(self::EMAIL_PATTERN, $email)) {
            $errors[] = 'That email address is not valid';
        }
        else {
            $email_taken = (bool)$this->em->getRepository(User::class)->findOneBy(['email' => $email]);
            if ($email_taken) {
                $errors[] = 'That email address is already in use';
            }
        }

        // Validate username
        if (empty($username)) {
            $errors[] = 'Username required';
        }
        else if (strlen($username) < 6) {
            $errors[] = 'Your username must be at least 6 characters';
        }
        else {
            $username_taken = (bool)$this->em->getRepository(User::class)->findOneBy(['username' => $username]);
            if ($username_taken) {
                $errors[] = 'That username is already taken';
            }
        }

        if (strlen($password) < 6) {
            $errors[] = 'Password must be at least 6 characters';
        }

        // Throw exception if reg form was invalid
        if ($errors) {
            throw new RegistrationException($errors);
        }
    }
}
