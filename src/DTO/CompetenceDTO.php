<?php

namespace App\DTO;

use Symfony\Component\Validator\Constraints as Assert;

class CompetenceDTO
{
    public const VALID_LEVELS = ['Les bases', 'Intermédiaire', 'Avancé'];

    public function __construct(
        #[Assert\Type('int')]
        public ?int $id = null,

        #[Assert\NotBlank]
        #[Assert\Type('string')]
        public string $name,

        #[Assert\NotBlank]
        #[Assert\Type('string')]
        public string $type,

        #[Assert\NotBlank(allowNull: true)]
        #[Assert\Type('string')]
        #[Assert\Choice(choices: self::VALID_LEVELS, message: 'Le niveau doit être l\'une des valeurs suivantes : "Les bases", "Intermédiaire", "Avancé".')]
        public ?string $level = null,

        #[Assert\NotBlank]
        #[Assert\Type('string')]
        public string $logo,
    ) {}
}
