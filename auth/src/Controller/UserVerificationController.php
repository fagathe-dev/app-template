<?php

namespace Auth\Controller;

use App\Entity\User;
use App\Form\Auth\VerificationType;
use App\Repository\UserRepository;
use App\Service\AuthService;
use App\Service\UserRequestService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/verification', name: 'auth_verification_')]
final class UserVerificationController extends AbstractController
{
    public function __construct(
        private readonly UserRequestService $userRequestService,
        private readonly AuthService $authService,
    ) {}

    #[Route('/{token}', name: 'verify', methods: ['GET'], requirements: ['token' => '^[A-Za-z0-9@!?.+]+$'])]
    public function verificationUser(string $token): RedirectResponse
    {
        $this->authService->verificationUser($token);
        return $this->redirectToRoute('auth_login');
    }

    #[Route('', name: 'index', methods: ['GET', 'POST'])]
    public function index(Request $request): Response
    {
        $form = $this->createForm(VerificationType::class);

        $form->handleRequest($request);
        if ($form->isSubmitted() && $form->isValid()) {
            $data = $form->getData();
            // Check if the user exists and send verification email
            $this->userRequestService->userRequestVerificationEmail($data);

            return $this->redirectToRoute('auth_verification_index');
        }

        return $this->render('@auth/registration/index.html.twig', compact('form'));
    }
}
