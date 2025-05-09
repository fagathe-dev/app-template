<?php

namespace App\Controller;

use Fagathe\Libs\Helpers\IPChecker;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class AdminController extends AbstractController
{

    public function __construct(private IPChecker $ipchecker) {}

    #[Route('/admin', name: 'admin')]
    public function index(Request $request): Response
    {
        return $this->render('admin/index.html.twig');
    }
}
