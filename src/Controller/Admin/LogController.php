<?php

namespace App\Controller\Admin;

use App\Service\LogService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/admin/log', name: 'admin_log_')]
final class LogController extends AbstractController
{

    public function __construct(private LogService $logService)
    {
        // Constructor logic if needed
    }

    #[Route('', name: 'index', methods: ['GET'])]
    public function index(Request $request): Response
    {
        // Render the log index page
        return $this->render('admin/log/index.html.twig', $this->logService->getLogFiles());
    }

    #[Route('/files', name: 'files', methods: ['GET'])]
    public function getLogFilesAction(Request $request): Response
    {
        // Fetch log files using the LogService

        // Render the log files in a Twig template
        return $this->json(
            $this->logService->getLogFiles(),
            Response::HTTP_OK,
            [],
        );
    }

    #[Route('', name: 'show', methods: ['GET'])]
    public function show(): Response
    {
        // Render the log index page
        return $this->render('admin/log/index.html.twig');
    }
}
