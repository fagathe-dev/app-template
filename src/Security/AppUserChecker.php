<?php

namespace App\Security;

use App\Entity\User;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAccountStatusException;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Core\User\UserCheckerInterface;

class AppUserChecker implements UserCheckerInterface
{
    public function checkPreAuth(UserInterface $user): void
    {
        // Vérifier que le compte est activé
        if ($user instanceof User && !$user->isActive()) {
            throw new CustomUserMessageAccountStatusException('Votre compte n\'a pas encore été activé. Veuillez vérifier votre email pour l\'activer.');
        }
    }

    public function checkPostAuth(UserInterface $user): void
    {
        // Logique post-authentification, si nécessaire...
    }
}
