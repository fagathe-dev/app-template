<?php

namespace Admin\Controller;

use Fagathe\Libs\Helpers\Request\NativeSession;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

final class DefaultController extends AbstractController
{

    public function __construct()
    {
    }

    #[Route('', name: 'admin_index', methods: ['GET'])]
    public function index(): Response
    {
        return $this->redirectToRoute('admin_dashboard');
    }

    #[IsGranted('admin.dashboard.view')]
    #[Route('/dashboard', name: 'admin_dashboard', methods: ['GET'])]
    public function dashboard(): Response
    {
        return $this->render('@admin/index.html.twig');
    }
}
