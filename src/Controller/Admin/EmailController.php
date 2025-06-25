<?php
namespace App\Controller\Admin;

use App\Service\EmailService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/admin/email', name: 'admin_email_')]
final class EmailController extends AbstractController
{
    public function __construct(private readonly EmailService $emailService)
    {
    }

    #[Route('', name: 'index')]
    public function index(): Response
    {
        return $this->render('admin/emails/index.html.twig', $this->emailService->index());
    }
}
