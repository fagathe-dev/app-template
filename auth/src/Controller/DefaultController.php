<?php

namespace Auth\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class DefaultController extends AbstractController
{


    public function __construct() {}

    #[Route('/auth', name: 'auth')]
    public function index(): Response
    {
        return $this->render('@auth/index.html.twig');
    }
}
