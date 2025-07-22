<?php

namespace App\Controller;

use Fagathe\Libs\Utils\Mailer\MailerService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;
use Symfony\Component\Mime\Part\DataPart;
use Symfony\Component\Mime\Part\File;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/', name: 'app_home_')]
class HomeController extends AbstractController
{

    public function __construct(private MailerService $mailer) {}

    #[Route('', name: 'index')]
    public function index(): Response
    {
        return $this->render('landing/index.html.twig');
    }
}
