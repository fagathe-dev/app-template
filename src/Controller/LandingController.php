<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class LandingController extends AbstractController
{


    public function __construct() {}

    #[Route('/landing', name: 'landing')]
    public function index(): Response
    {
        return $this->render('landing/index.html.twig');
    }
}
