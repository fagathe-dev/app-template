<?php

namespace App\Controller;

use Fagathe\Libs\DetectDevice\DetectDevice;
use Fagathe\Libs\Helpers\IPChecker;
use Fagathe\Libs\JSON\JsonSerializer;
use Fagathe\Libs\Logger\Log;
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

        // $log = (new Log())
        //     ->setLevel(LoggerLevelEnum::Info)
        //     ->setTimestamp(new \DateTimeImmutable())
        //     ->addContext('ip', $this->ipchecker->getIp()) # '66.39.189.44') 
        //     ->addContext('device', $this->detectDevice->getDeviceType()->value)
        //     ->addContext('browser', $this->detectDevice->getBrowser()->value)
        //     ->addContext('action', 'Admin page accessed')
        //     ->addContext('user_id', 'fagathe77@gmail.com')
        //     ->addContent('data', $person)
        //     ->addContent('message', 'Admin page accessed successfully')
        //     ->setOrigin($request->getSchemeAndHttpHost() . $request->getPathInfo())
        // ->generate();
        $log = [
            'level' => 'info',
            'timestamp' => '2025-05-10 14:30:45',
            'context' => [
                'ip' => $this->ipchecker->getIp(), // '66.39.189.44'
                'device' => $this->detectDevice->getDeviceType()->value,
                'browser' => $this->detectDevice->getBrowser()->value,
                'action' => 'Admin page accessed',
                'user_id' => 'fagathe77@gmail.com',
            ],
            'content' => [
                'data' => $person,
                'message' => 'Admin page accessed successfully',
            ],
            'origin' => $request->getSchemeAndHttpHost() . $request->getPathInfo(),
        ];
        $log = $this->jsonSerializer->denormalize($log, Log::class);
        $log = $log->generate();
        // dd($log->generate());

        return $this->render('admin/index.html.twig', compact( 'log'));
    }
}
