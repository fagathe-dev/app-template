<?php

namespace Admin\Controller;

use Admin\Form\UserType;
use Admin\Service\UserService;
use App\Entity\User;
use Fagathe\Libs\Front\Breadcrumb\Breadcrumb;
use Fagathe\Libs\Front\Breadcrumb\BreadcrumbItem;
use Fagathe\Libs\Security\Enum\RoleEnum;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/user', name: 'admin_user_')]
final class UserController extends AbstractController
{

    public function __construct(private readonly UserService $userService) {}

    #[Route('', name: 'index', methods: ['GET'])]
    #[IsGranted('admin.user.list')]
    public function index(Request $request): Response
    {
        return $this->render('@admin/user/index.html.twig', $this->userService->index($request));
    }
    
    #[Route('/create', name: 'create', methods: ['GET', 'POST'])]
    #[IsGranted('admin.user.create')]
    public function create(Request $request): Response
    {
        $user = new User;
        $breadcrumb = $this->userService->breadcrumb([
            new BreadcrumbItem('Créer un utilisateur', $this->generateUrl('admin_user_create'))
        ]);

        $form = $this->createForm(UserType::class, $user);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $this->userService->create($user);

            return $this->redirectToRoute('admin_user_index');
        }

        return $this->render('@admin/user/create.html.twig', compact('form', 'user', 'breadcrumb'));
    }

    #[Route('/{id}/edit', name: 'edit', methods: ['GET', 'POST'], requirements: ['id' => '\d+'])]
    #[IsGranted('admin.user.edit')]
    public function edit(Request $request, User $user): Response
    {
        $breadcrumb = $this->userService->breadcrumb([
            new BreadcrumbItem('Éditer un utilisateur', $this->generateUrl('admin_user_edit', ['id' => $user->getId()]))
        ]);

        return $this->render('@admin/user/edit.html.twig', compact( 'user', 'breadcrumb'));
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    #[IsGranted('admin.user.delete')]
    public function delete(Request $request, User $user): Response
    {
        if ($this->isCsrfTokenValid('delete' . $user->getId(), $request->request->get('_token'))) {
            $this->userService->delete($user);
            $this->addFlash('success', 'L\'utilisateur a été supprimé avec succès.');
        } else {
            $this->addFlash('error', 'Le token CSRF est invalide.');
        }

        return $this->redirectToRoute('admin_user_index');
    }
}
