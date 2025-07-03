<?php

namespace App\DTO;

use Symfony\Component\Validator\Constraints as Assert;

class ProjectDTO
{
    public function __construct(
        #[Assert\Type('int')]
        public ?int $id = null,

        #[Assert\NotBlank]
        #[Assert\Type('string')]
        public string $name,

        #[Assert\Type('string')]
        public ?string $description = null,

        /**
         * @var string[]
         */
        #[Assert\All([
            new Assert\Type('string')
        ])]
        #[Assert\Type('array')]
        public array $tasks = [],

        #[Assert\Type('string')]
        public ?string $image = null,

        #[Assert\NotBlank]
        #[Assert\Type('string')]
        public string $type,

        #[Assert\Url]
        #[Assert\Type('string')]
        public ?string $url = null,

        #[Assert\Type('bool')]
        public bool $published = false,
    ) {}
}
