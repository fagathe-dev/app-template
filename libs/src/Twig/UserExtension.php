<?php
namespace Fagathe\Libs\Twig;

use App\Entity\User;
use Fagathe\Libs\Security\Enum\RoleEnum;
use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

class UserExtension extends AbstractExtension
{
    public function getFunctions(): array
    {
        return [
            new TwigFunction("roles", [$this, "getRoles"]),
            new TwigFunction("nice_role", [$this, "niceRole"]),
        ];
    }

    public function getRoles(User $user): string
    {
        $roles = [];
        foreach ($user->getRoles() as $role) {
            $roles[] = $this->niceRole($role);
        }

        return join(', ', $roles);
    }

    public function niceRole(string $role): string
    {
        return RoleEnum::matchLabel($role);
    }
    
}