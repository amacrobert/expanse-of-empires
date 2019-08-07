<?php

namespace App\Controller;

use Symfony\Component\Routing\Annotation\Route;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\{Request, JsonResponse};
use Symfony\Component\Security\Core\Encoder\UserPasswordEncoderInterface;
use Symfony\Component\Security\Http\Authentication\AuthenticationUtils;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorage;
use Symfony\Component\Security\Core\Authorization\AuthorizationCheckerInterface;
use Doctrine\ORM\EntityManagerInterface;
use App\Form\UserType;
use App\Entity\User\User;
use App\Entity\Match\{Match, Empire};
use App\Entity\Map\Territory;
use App\Entity\Chat\Message;
use App\Service\User\AuthService;
use App\Service\Match\MatchService;
use App\Exception\RegistrationException;
use Exception;

/**
 * @Route("/api")
 */
class ApiController extends AbstractController {
    /**
     * @Route("/match/{match_id}/empire", name="create_empire", methods={"POST"})
     */
    public function createEmpire(
        $match_id,
        Request $request,
        MatchService $match_service,
        EntityManagerInterface $em)
    {
        $post_body = json_decode($request->getContent());
        $territory_id = $post_body->territory_id ?? 0;
        $user = $this->getUser();
        $match = $em->find(Match::class, $match_id);
        $territory = $em->find(Territory::class, $territory_id);

        if (!$user) {
            $error = 'unauthorized';
        }
        else if (!$match) {
            $error = 'match ' . $match_id . 'not found';
        }
        else if (!$territory) {
            $error = 'territory ' . $territory_id . ' not found';
        }

        if (isset($error)) {
            return new JsonResponse(['error' => $error], 400);
        }

        try {
            return new JsonResponse(
                $match_service->createEmpire($user, $match, $territory)
            );
        }
        catch (Exception $e) {
            return new JsonResponse([
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * @Route("/matches", name="matches")
     */
    public function getMatches(EntityManagerInterface $em)
    {
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
     * @Route("/match/{match_id}/empire", name="user_empire")
     */
    public function getUserEmpire(EntityManagerInterface $em, $match_id)
    {
        $user = $this->getUser();

        if (!$user) {
            return new JsonResponse(['message' => 'unauthorized'], 400);
        }

        if ($empire = $em->getRepository(Empire::class)->findOneBy([
            'user' => $user,
            'match' => $match_id,
        ])) {
            return new JsonResponse([
                'supply' => $empire->getSupply(),
                'tide' => $empire->getTide(),
            ]);
        }

        return new JsonResponse(['message' => 'user empire not found'], 400);
    }

    /**
     * @Route("/match/{match_id}/chat", name="match_chat")
     */
    public function getMatchChat($match_id, EntityManagerInterface $em)
    {
        $messages = $em->getRepository(Message::class)->findBy([
            'match' => $em->getReference(Match::class, $match_id),
        ]);

        return new JsonResponse($messages);
    }

    /**
     * @Route("/match/{match_id}", name="match_details")
     */
    public function getMatchDetails($match_id, MatchService $match_service, EntityManagerInterface $em)
    {
        if ($match = $em->getRepository(Match::class)->find($match_id)) {
            $details = $match_service->getDetails($match);
            return new JsonResponse($details);
        }

        return new JsonResponse([
            'message' => 'Match not found'
        ], 400);
    }

    /**
     * @Route("/register", name="register", methods={"POST"})
     */
    public function register(Request $request, AuthService $auth)
    {
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

    /**
     * @Route("/user", name="user")
     */
    public function getAppUser()
    {
        $user = $this->getUser();
        if ($user) {
            $user_array = $user->jsonSerialize();
            return new JsonResponse(array_merge($user_array, ['token' => $user->getApiKey()]));
        }

        return new JsonResponse(null, 401);
    }
}
