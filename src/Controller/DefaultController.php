<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Routing\Annotation\Route;
use App\Entity\User\User;

class DefaultController extends AbstractController {
    /**
     * @Route("/", name="homepage")
     */
    public function index() {
        return $this->renderApp();
    }

    /**
     * @Route("/match/{match_id}", name="match", requirements={"react_route"=".+"})
     */
    public function match($match_id) {
        return $this->renderApp();
    }

    // Renders the base template, where React bootstraps from
    private function renderApp() {
        return $this->render('index.html.twig', []);
    }
}
