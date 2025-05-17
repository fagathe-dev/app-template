<?php

namespace App\Controller;

use Fagathe\Libs\DetectDevice\DetectDevice;
use Fagathe\Libs\Helpers\IPChecker;
use Fagathe\Libs\JSON\JsonSerializer;
use Fagathe\Libs\Logger\Log;
use Fagathe\Libs\Logger\Logger;
use Fagathe\Libs\Logger\LoggerLevelEnum;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class AdminController extends AbstractController
{

    public function __construct(private IPChecker $ipchecker, private DetectDevice $detectDevice, private JsonSerializer $jsonSerializer) {}

    #[Route('/admin', name: 'admin')]
    public function index(Request $request): Response
    {
        $person = [
            'name' => 'John Doe',
            'age' => 30,
            'email' => 'email@domain.com'
        ];

        $log = [
            'level' => 'info',
            'context' => [
                'action' => 'Admin page accessed',
            ],
            'content' => [
                'data' => $person,
                'message' => 'Admin page accessed successfully',
            ],
            'origin' => $request->getSchemeAndHttpHost() . $request->getPathInfo(),
            'timestamp' => date('Y-m-d H:i:s'),
        ];

        $logger = new Logger('admin/consultation');
        $logger->info($log['content'], $log['context']);
        $log = $this->jsonSerializer->denormalize($log, Log::class);
        $log = $log->generate();

        return $this->render('admin/index.html.twig', compact('log'));
    }
}
