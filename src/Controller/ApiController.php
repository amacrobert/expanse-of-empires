<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Core\Encoder\UserPasswordEncoderInterface;
use Symfony\Component\Security\Http\Authentication\AuthenticationUtils;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorage;
use Doctrine\ORM\EntityManagerInterface;
use App\Form\UserType;
use App\Entity\User;
use App\Entity\Match\Match;
use App\Entity\Chat\Message;

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

    /**
     * @Route("/match/{match_id}/chat", name="match_chat")
     */
    public function getMatchChat($match_id, EntityManagerInterface $em) {
        $messages = $em->getRepository(Message::class)->findBy([
            'match' => $em->getReference(Match::class, $match_id),
        ]);

        return new JsonResponse($messages);
    }
}
