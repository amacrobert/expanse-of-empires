<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Routing\Annotation\Route;

class DefaultController extends AbstractController {
    /**
     * @Route("/", name="homepage")
     */
    public function index() {
        return $this->render('index.html.twig', [
            'message' => 'hello world',
        ]);
    }
}
