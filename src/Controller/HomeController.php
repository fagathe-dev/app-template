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

class HomeController extends AbstractController
{

    public function __construct(private MailerService $mailer) {}

    #[Route('/', name: 'home')]
    public function index(): Response
    {
        $file = dirname(__DIR__, 2) . '/public/images/logo-light.png';
        $file_name = basename($file);
        $file_mime_type = mime_content_type($file);

        $email = (new Email)
            ->from(new Address('contact@fagathe-dev.me', 'Fagathe Dev'))
            ->to('fagathe77@gmail.com')
            ->subject('Test SMTP')
            ->text('Bonjour Frédérick,')
            ->addPart(new DataPart(new File($file), $file_name, $file_mime_type)) // Ensure the logo is attached correctly
        ;

        $this->mailer->sendEmail(
            ['Frédérick AGATHE' => 'fagathe77@gmail.com'],
            'Vérification de compte',
            'auth/verify-account',
            [
                'user' => [
                    'name' => 'Frédérick',
                    'email' => 'fagathe77@gmail.com',
                    'username' => 'fagathe77',
                ],
                'activation_link' => 'https://example.com/activate?token=123456',
            ]
        );
        return $this->render('landing/index.html.twig');
    }
}
