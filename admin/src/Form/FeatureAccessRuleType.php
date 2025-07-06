<?php

namespace Admin\Form;

use Admin\Service\FeatureAccessRuleService;
use App\Dto\FeatureAccessRuleDTO;
use Fagathe\Libs\Security\Enum\RoleEnum;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\CheckboxType;
use Symfony\Component\Form\Extension\Core\Type\ChoiceType; // Pour une liste de choix de rôles
use Symfony\Component\Form\Extension\Core\Type\SubmitType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;
use Symfony\Component\Validator\Constraints\Callback;
use Symfony\Component\Validator\Context\ExecutionContextInterface;

class FeatureAccessRuleType extends AbstractType
{
    // C'est mieux de récupérer les rôles de manière dynamique, par exemple via un service
    private array $availableRoles = ['ROLE_USER', 'ROLE_EDITOR', 'ROLE_ADMIN']; // Exemple

    public function __construct(private FeatureAccessRuleService $featureService) {}

    public function buildForm(FormBuilderInterface $builder, array $options): void
    {

        $builder
            ->add('id', TextType::class, [
                'label' => 'Identifiant de la fonctionnalité',
                'constraints' => [
                    // Voici la validation d'unicité custom sous forme de Callback
                    new Callback([
                        'callback' => function (?string $value, ExecutionContextInterface $context): void {
                            // Si l'ID est vide, d'autres validateurs (NotBlank) le géreront
                            if (null === $value || '' === $value) {
                                return;
                            }
                            
                            // Vérifier si l'ID existe déjà
                            $existingFeature = $this->featureService->checkIfIDExists($value);

                            // Si la fonctionnalité existe déjà ET que nous sommes en mode création
                            // OU si l'ID existant est différent de l'ID d'origine en mode édition
                            if ($existingFeature) {
                                $context->buildViolation('L\'identifiant de la fonctionnalité "{{ value }}" existe déjà.')
                                    ->setParameter('{{ value }}', $value)
                                    ->addViolation();
                            }
                        },
                        // On peut aussi définir un message par défaut ici si on ne veut pas le mettre directement dans buildViolation
                        // 'message' => 'L\'identifiant de la fonctionnalité "{{ value }}" existe déjà.',
                    ]),
                ],
            ])
            ->add('name', TextType::class, [
                'label' => 'Nom affiché',
            ])
            ->add('enabled', CheckboxType::class, [
                'label' => 'Activée globalement',
                'required' => false,
            ])
            // Nouveau champ pour le rôle minimum
            ->add('minimumAccessRole', ChoiceType::class, [
                'label' => 'Rôle minimum requis',
                'choices' => RoleEnum::choices(false), // Crée [ROLE_USER => ROLE_USER, ...]
                'placeholder' => 'Accès public (aucun rôle minimum)', // Option pour laisser vide = public
                'required' => false, // Peut être null si l'accès est public
            ])
            ->add('requiresOwnerMatch', CheckboxType::class, [
                'label' => 'Propriétaire requis',
                'required' => false,
            ])
            ->add('strictOwnerOnly', CheckboxType::class, [
                'label' => 'Propriétaire strict',
                'required' => false,
            ])
            ->add('save', SubmitType::class, [
                'label' => 'Enregistrer',
                'attr' => ['class' => 'btn btn-primary'],
            ])
        ;
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => FeatureAccessRuleDTO::class,
            'csrf_protection' => true,
            'is_creation_mode' => false, // Par défaut, ce n'est pas en mode création
        ]);
    }

    // Dans un vrai projet, cette liste viendrait d'un service ou de security.yaml
    // Vous pouvez injecter un service qui gère la liste de vos rôles disponibles si nécessaire.
}
