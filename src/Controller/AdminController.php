<?php

namespace App\Controller;

use Fagathe\Libs\DetectDevice\DetectDevice;
use Fagathe\Libs\Helpers\IPChecker;
use Fagathe\Libs\Logger\Log;
use Fagathe\Libs\Logger\LoggerLevelEnum;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class AdminController extends AbstractController
{

    public function __construct(private IPChecker $ipchecker, private DetectDevice $detectDevice) {}

    #[Route('/admin', name: 'admin')]
    public function index(Request $request): Response
    {
        $person = [
            'name' => 'John Doe',
            'age' => 30,
            'email' => 'email@domain.com'
        ];
        dump($request->getSchemeAndHttpHost());
        $content = htmlentities(json_encode($person, JSON_PRETTY_PRINT), ENT_QUOTES, 'UTF-8');
        $log = (new Log())
            ->setLevel(LoggerLevelEnum::Info)
            ->setTimestamp(new \DateTimeImmutable())
            ->addContext('ip', $this->ipchecker->getIp()) # '66.39.189.44') 
            ->addContext('device', $this->detectDevice->getDeviceType())
            ->addContext('browser', $this->detectDevice->getBrowser())
            ->addContext('action', 'Admin page accessed')
            ->addContext('user_id', 'fagathe77@gmail.com')
            ->addContent('data', $person)
            ->addContent('message', 'Admin page accessed successfully')
            ->setOrigin($request->getSchemeAndHttpHost() . $request->getPathInfo())
            ->generate();
        // dd($log->generate());

        return $this->render('admin/index.html.twig', compact('content', 'log'));
    }
}
