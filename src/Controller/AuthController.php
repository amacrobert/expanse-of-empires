<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Core\Encoder\UserPasswordEncoderInterface;
use Symfony\Component\Security\Http\Authentication\AuthenticationUtils;
use Doctrine\ORM\EntityManagerInterface;
use App\Form\UserType;
use App\Entity\User\User;

class AuthController extends AbstractController {
    /**
     * @Route("/login", name="login")
     */
    public function login(Request $request) {
    }

    /**
     * @Route("/register", name="user_registration")
     */
    public function register(
        Request $request,
        UserPasswordEncoderInterface $password_encoder,
        EntityManagerInterface $em
        ) {

        $user = new User;
        $form = $this->createForm(UserType::class, $user);

        $form->handleRequest($request);

        // foreach ($form->getErrors() as $error) {
        //     print $error->getCause() . ' | ';
        //     print $error->getMessage();
        //     print '<br>';
        // }
        // exit();

        if ($form->isSubmitted()) {

            if ($form->isValid()) {

                $password = $password_encoder->encodePassword($user, $user->getPlainPassword());
                $user->setPassword($password);

                $em->persist($user);
                $em->flush($user);
            }

            else {
            }
        }

        return $this->render('auth/register.html.twig', [
            'form' => $form->createView(),
        ]);
    }
}
