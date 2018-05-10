<?php

namespace App\Security;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Http\Authentication\AuthenticationFailureHandlerInterface;
use Symfony\Component\Security\Http\Authentication\AuthenticationSuccessHandlerInterface;
use Symfony\Component\HttpFoundation\Session\SessionInterface;

class AuthenticationHandler implements AuthenticationSuccessHandlerInterface, AuthenticationFailureHandlerInterface {

    protected $session;

    public function __construct(SessionInterface $session) {
        $session->start();
        $this->session = $session;
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token) {

        $user = $token->getUser();

        return new JsonResponse([
            'user' => $user,
            'api_key' => $user->getApiKey(),
            'session' => $this->session->getId(),
        ]);
    }

    public function onAuthenticationFailure( Request $request, AuthenticationException $exception ) {
        return new JsonResponse([
            'error' => $exception->getMessage(),
        ], 403);
    }

}
