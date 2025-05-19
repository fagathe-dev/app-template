<?php

namespace Fagathe\Libs\Security\Enum;

enum RoleEnum: string
{
    case ROLE_PUBLIC_ACCESS = 'ROLE_PUBLIC_ACCESS';
    case ROLE_AUTHENTICATED = 'ROLE_AUTHENTICATED';
    case ROLE_USER = 'ROLE_USER';
    case ROLE_EDITOR = 'ROLE_EDITOR';
    case ROLE_MANAGER = 'ROLE_MANAGER';
    case ROLE_ADMIN = 'ROLE_ADMIN';
    case ROLE_SUPER_ADMIN = 'ROLE_SUPER_ADMIN';

    private const EXCLUDED_ROLES = [self::ROLE_PUBLIC_ACCESS, self::ROLE_AUTHENTICATED,];


    /**
     * @return string
     */
    public function name(): string
    {
        return $this->name;
    }

    /**
     * @param string $name
     * 
     * @return int
     */
    public static function level(string $name): int
    {
        $role = static::tryFrom($name);

        return match ($role) {
            self::ROLE_PUBLIC_ACCESS => 0,
            self::ROLE_AUTHENTICATED => 20,
            self::ROLE_USER => 50,
            self::ROLE_EDITOR => 100,
            self::ROLE_MANAGER => 200,
            self::ROLE_ADMIN => 900,
            self::ROLE_SUPER_ADMIN => 1000,
            default => 0,
        };
    }

    /**
     * @param string|object $role
     * 
     * @return string
     */
    public static function matchLabel(string|object $role): string
    {
        if (is_string($role)) {
            $role = static::tryFrom($role);
        }

        return match ($role) {
            self::ROLE_USER => 'Utilisateur',
            self::ROLE_EDITOR => 'Éditeur',
            self::ROLE_MANAGER => 'Gestionnaire',
            self::ROLE_ADMIN => 'Administrateur',
            self::ROLE_SUPER_ADMIN => 'Super Administrateur',
            default => 0,
        };
    }

    /**
     * @return array
     */
    public static function labels(): array
    {
        $cases = static::cases();
        $excludedCases = static::EXCLUDED_ROLES;
        $labels = [];
        foreach ($cases as $key => $case) {
            if (!in_array($case, $excludedCases)) {
                $labels[$key] = static::matchLabel($case);
            }
        }

        return $labels;
    }

    /**
     * @return array
     */
    public static function getUserRoles(): array
    {
        $cases = static::cases();
        $excludedCases = static::EXCLUDED_ROLES;
        $choices = [];

        foreach ($cases as $case) {
            if (!in_array($case, $excludedCases)) {
                $choices[] = $case->value;
            }
        }

        return array_unique($choices);
    }

    /**
     * @return array
     */
    public static function choices(): array
    {
        $cases = static::cases();
        $excludedCases = static::EXCLUDED_ROLES;
        $choices = [];

        foreach ($cases as $case) {
            if (!in_array($case, $excludedCases)) {
                $choices[$case->name()] = static::matchLabel($case);
            }
        }

        return array_unique($choices);
    }
}