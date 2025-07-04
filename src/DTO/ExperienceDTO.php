<?php

namespace App\DTO;

use Symfony\Component\Validator\Constraints as Assert;

class ExperienceDTO
{
    public function __construct(
        #[Assert\Type('int')]
        public ?int $id = null,

        #[Assert\NotBlank]
        #[Assert\Type('string')]
        public string $type,

        #[Assert\NotBlank]
        #[Assert\Type('string')]
        public string $name,

        #[Assert\NotBlank]
        #[Assert\Type('string')]
        public string $place,

        #[Assert\NotBlank]
        #[Assert\Type('int')]
        #[Assert\Range(min: 2010, max: 2100)]
        public int $startYear,

        #[Assert\Type('int')]
        #[Assert\Range(min: 2010, max: 2100)]
        public ?int $endYear = null,

        /**
         * @var string[]
         */
        #[Assert\All([
            new Assert\Type('string')
        ])]
        #[Assert\Type('array')]
        public array $tasks = [],
    ) {
    }
}