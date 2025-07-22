<?php

namespace Auth\Controller;

use App\Entity\UserRequest;
use App\Service\UserRequestService;
use Fagathe\Libs\Helpers\Request\NativeSession;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/request/verification', name: 'auth_request_verification_')]
final class UserRequestVerificationController extends AbstractController
{
    public function __construct(private UserRequestService $userRequestService) {}

    #[Route('/{token}', name: 'verify', methods: ['GET'], requirements: ['token' => '^[A-Za-z0-9@!?.+]+$'])]
    public function userRequestVerification(string $token): RedirectResponse
    {
        $session = new NativeSession();
        $this->userRequestService->userRequestVerification($token);
        $redirect_url = $session->get(UserRequestService::VERIFICATION_REDIRECT_ROUTE_NAME);
        $session->remove(UserRequestService::VERIFICATION_REDIRECT_ROUTE_NAME);

        return $this->redirect(
            url: $redirect_url ?: $this->generateUrl('app_home_index'),
        );
    }
}
