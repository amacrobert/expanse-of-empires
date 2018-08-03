<?php

namespace App\Controller;

use Symfony\Component\Routing\Annotation\Route;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Encoder\UserPasswordEncoderInterface;
use Symfony\Component\Security\Http\Authentication\AuthenticationUtils;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorage;
use Symfony\Component\Security\Core\Authorization\AuthorizationCheckerInterface;
use Doctrine\ORM\EntityManagerInterface;
use App\Form\UserType;
use App\Entity\User\User;
use App\Entity\Match\Match;
use App\Entity\Match\Empire;
use App\Entity\Chat\Message;
use App\Service\User\AuthService;
use App\Exception\RegistrationException;

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

        if ($user = $this->getUser()) {

            $user_empires = $em->getRepository(Empire::class)->findBy([
                'user' => $user,
                'match' => $matches,
            ]);

            foreach ($matches as $match) {
                foreach ($user_empires as $user_empire) {
                    if ($match->getEmpires()->contains($user_empire)) {
                        $match->setUserEmpire($user_empire);
                    }
                }
            }
        }

        return new JsonResponse($matches);
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

    /**
     * @Route("/register", name="register", methods={"POST"})
     */
    public function register(Request $request, AuthService $auth) {
        $post_body = json_decode($request->getContent());

        $email = $post_body->email;
        $username = $post_body->username;
        $password = $post_body->password;

        try {
            $result = $auth->register($email, $username, $password);
            return new JsonResponse($result);
        }
        catch (RegistrationException $e) {
            return new JsonResponse($e->getRegistrationErrors(), 400);
        }
    }
}
