<?php

namespace Admin\Form;

use App\Entity\User;
use Fagathe\Libs\Security\Enum\RoleEnum;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\CheckboxType;
use Symfony\Component\Form\Extension\Core\Type\ChoiceType;
use Symfony\Component\Form\Extension\Core\Type\EmailType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\Form\FormInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class UserType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('firstname', TextType::class, [
                'label' => 'Prénom',
                'required' => false,
            ])
            ->add('lastname', TextType::class, [
                'label' => 'Nom de famille',
                'required' => false,
            ])
            ->add('username', TextType::class, [
                'label' => 'Nom d\'utilisateur',
                'required' => false,
            ])
            ->add('email', EmailType::class, [
                'label' => 'Adresse e-mail',
                'required' => false,
            ])
            ->add('roles', ChoiceType::class, [
                'label' => 'Rôle de l\'utilisateur',
                'choices' => RoleEnum::choices(), // Crée [ROLE_USER => ROLE_USER, ...]
                // Ces deux options font qu'il s'agit d'un champ select à sélection unique
                'multiple' => false, // Permet de sélectionner un seul rôle
                'expanded' => false, // Affiche les choix dans un élément <select> déroulant

                // Optionnel : si tu veux un libellé par défaut (ex: "Choisir un rôle")
                'placeholder' => 'Choisir un rôle',

                // Si ton entité User.roles est un array (ce qui est le cas pour UserInterface),
                // il faut une petite astuce pour qu'il soit mappé à une seule valeur string pour ce champ.
                // Symfony peut faire la conversion, mais il faut s'assurer que le DataMapper gère ça.
                // Par défaut, ChoiceType s'attend à ce que la propriété associée soit une string si multiple est false.
                // Si la propriété 'roles' de ton entité est bien un array, tu devras peut-être le transformer.
                'getter' => fn(User $user, FormInterface $form) => $user->getRoles()[0] ?? null,
                'setter' => function (User $user, ?string $role, FormInterface $form) {
                    // Définit le rôle comme un tableau, en s'assurant que 'ROLE_USER' est toujours présent
                    $roles = ['ROLE_USER']; // Rôle de base pour tous les utilisateurs
                    if ($role && $role !== 'ROLE_USER') {
                        $roles[] = $role;
                    }
                    $user->setRoles(array_unique($roles));
                },
            ])
            ->add('active',  CheckboxType::class, [
                'label' => 'Activer l\'utilisateur',
                'required' => false,
                'attr' => [
                    'role' => 'switch', // Ajoute le rôle switch à l'input
                ],
                'row_attr' => [
                    'class' => 'form-check form-switch form-switch-md mb-3', // Ajoute les classes à la div parent
                    'style' => 'padding-inline-start: 1.5em;'
                ],
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
            'data_class' => User::class,
        ]);
    }
}
