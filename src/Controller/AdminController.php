<?php

namespace App\Controller;

use Fagathe\Libs\DetectDevice\DetectDevice;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class AdminController extends AbstractController
{

    public function __construct(private DetectDevice $detectDevice){}

    #[Route('/admin', name: 'admin')]
    public function index(Request $request): Response
    {
        dump($request->headers->get('User-Agent'));
        dd($this->detectDevice->getDeviceType(), $this->detectDevice->getBrowser());
        return $this->render('admin/index.html.twig');
    }
}
