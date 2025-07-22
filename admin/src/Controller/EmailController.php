<?php
namespace Admin\Controller;

use Admin\Service\EmailService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/email', name: 'admin_email_')]
final class EmailController extends AbstractController
{
    public function __construct(private readonly EmailService $emailService)
    {
    }

    #[Route('', name: 'index')]
    #[IsGranted('email.template.list')]
    public function index(): Response
    {
        return $this->render('@admin/emails/index.html.twig', $this->emailService->index());
    }
}
