<?php

namespace Admin\Controller;

use Admin\Service\FeatureAccessRuleService;
use App\DTO\FeatureAccessRuleDTO;
use Admin\Form\FeatureAccessRuleType;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\HttpFoundation\JsonResponse; // Pour l'exemple API
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted("ROLE_ADMIN")]
#[Route('/features-access-rules', name: 'admin_features_access_rules_')]
class FeatureAccessRuleController extends AbstractController
{
    // ... (précédent code listFeatures) ...

    public function __construct(
        private Security $security,
        private FeatureAccessRuleService $featureService,
    ) {}

    #[Route('', name: 'index', methods: ['GET'])]
    public function listFeatures(): Response
    {
        return $this->render('@admin/features-access-rules/index.html.twig', $this->featureService->index());
    }

    // Nouvelle action pour afficher le formulaire d'édition
    #[Route('/{id}/edit', name: 'edit', methods: ['GET', 'POST'])]
    public function editFeature(string $id, Request $request): Response
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $feature = $this->featureService->getFeatureConfig($id);
        if (!$feature) {
            throw $this->createNotFoundException('Fonctionnalité non trouvée.');
        }

        // Créer le formulaire et le pré-remplir avec le DTO
        $form = $this->createForm(FeatureAccessRuleType::class, $feature);
        $form->handleRequest($request); // Traiter la requête, même si c'est une GET

        if ($form->isSubmitted() && $form->isValid()) {
            $this->featureService->updateFeatureConfig($feature); // Appeler la méthode de mise à jour
            $this->addFlash('success', 'La fonctionnalité a été mise à jour avec succès.');

            return $this->redirectToRoute('admin_features_access_rules_index');
        }

        // Passer le formulaire à la vue
        return $this->render('@admin/features-access-rules/edit.html.twig', [
            'form' => $form,
            'edit' => true, // Indiquer que c'est un formulaire d'édition
            'feature' => $feature, // Passer les données de la fonctionnalité pour pré-remplir le formulaire
            ...$this->featureService->edit($id)
        ]);
    }
    // Nouvelle action pour afficher le formulaire d'édition
    #[Route('/new', name: 'new', methods: ['GET', 'POST'])]
    public function addFeature(Request $request): Response
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $feature = new FeatureAccessRuleDTO;
        if (!$feature) {
            throw $this->createNotFoundException('Fonctionnalité non trouvée.');
        }

        // Créer le formulaire et le pré-remplir avec le DTO
        $form = $this->createForm(FeatureAccessRuleType::class, $feature);
        $form->handleRequest($request); // Traiter la requête, même si c'est une GET

        if ($form->isSubmitted() && $form->isValid()) {
            $this->featureService->addFeatureConfig($feature); // Appeler la méthode de mise à jour
            $this->addFlash('success', 'La fonctionnalité a été créée avec succès.');

            return $this->redirectToRoute('admin_features_access_rules_index');
        }

        // Passer le formulaire à la vue
        return $this->render('@admin/features-access-rules/new.html.twig', [
            'form' => $form,
            'edit' => false, // Indiquer que c'est un formulaire d'édition
            'feature' => $feature, // Passer les données de la fonctionnalité pour pré-remplir le formulaire
            ...$this->featureService->add()
        ]);
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function deleteFeature(string $id, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $this->featureService->deleteFeature($id);
        $this->addFlash('success', 'La fonctionnalité a été supprimée avec succès.');
        return $this->json(data: [], status: Response::HTTP_OK);
    }

    // ... (getDefinedRoles method, inchangée) ...
    private function getDefinedRoles(): array
    {
        return ['ROLE_USER', 'ROLE_EDITOR', 'ROLE_ADMIN'];
    }
}
