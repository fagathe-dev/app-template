<?php

namespace Admin\Controller;

use Admin\Service\LogService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/log', name: 'admin_log_')]
final class LogController extends AbstractController
{

    public function __construct(private LogService $logService)
    {
        // Constructor logic if needed
    }

    #[Route('', name: 'index', methods: ['GET'])]
    #[IsGranted('admin.log.view')]
    public function index(Request $request): Response
    {
        // Render the log index page
        return $this->render('@admin/log/index.html.twig', $this->logService->getLogFiles());
    }

    #[Route('/show/{date}', name: 'show', methods: ['GET'])]
    #[IsGranted('admin.log.view')]
    public function show(string $date, Request $request): Response
    {
        $file = $request->query->get('logFile', null);
        $data = [
            ...$this->logService->getFileLogs($file, $date),
            'is_markdown' => true,
        ];
        
        return $this->render('@admin/log/view.html.twig', $data);
    }
}
