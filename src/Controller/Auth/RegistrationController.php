<?php
namespace App\Controller\Auth;

use App\Entity\User;
use App\Form\Auth\RegistrationType;
use App\Repository\UserRepository;
use App\Service\UserService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/registration', name: 'auth_registration_')]
final class RegistrationController extends AbstractController
{
    public function __construct(private UserService $userService, private UserRepository $repository)
    {
    }

    #[Route('', name: 'index')]
    public function index(Request $request): Response
    {
        dd($this->repository->search('fagathe'));
        $user = new User;
        $form = $this->createForm(RegistrationType::class, $user);

        $form->handleRequest($request);
        if ($form->isSubmitted() && $form->isValid()) {
            if ($this->userService->create($user)) {
                return $this->redirectToRoute('app_login');
            }
        }

        return $this->render('auth/registration/index.html.twig', compact('form', 'user'));
    }
}