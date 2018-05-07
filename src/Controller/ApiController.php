<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Core\Encoder\UserPasswordEncoderInterface;
use Symfony\Component\Security\Http\Authentication\AuthenticationUtils;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorage;
use Doctrine\ORM\EntityManagerInterface;
use App\Form\UserType;
use App\Entity\User;
use App\Entity\Match\Match;

/**
 * @Route("/api")
 */
class ApiController extends Controller {
    /**
     * @Route("/user", name="user")
     */
    public function getAppUser() {
        $user = $this->getUser();
        return new JsonResponse($user);
    }

    /**
     * @Route("/matches", name="matches")
     */
    public function getMatches(EntityManagerInterface $em) {
        $matches = $em->getRepository(Match::class)->findBy([
            'visible' => true,
            'date_completed' => null,
        ]);

        return $this->json($matches);
    }

    // Overide getUser function until I figure out api auth
    protected function getUser() {
        $em = $this->get('App\Service\EntityManager');
        return $em->find(User::class, 1);
    }
}
