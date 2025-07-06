<?php
namespace Fagathe\Libs\Twig;

use Twig\Extension\AbstractExtension;
use Twig\TwigFilter;
use Twig\TwigFunction;

class UtilsExtension extends AbstractExtension
{

    public function __construct(private string $env = 'prod')
    {
        // Constructor code if needed
    }

    public function getFunctions(): array
    {
        return [
        ];
    }

    public function getFilters(): array
    {
        return [
            new TwigFilter("type", [$this, "getType"]),
        ];
    }

    /**
     * @param mixed $var
     * 
     * @return string
     */
    public function getType(mixed $var): string
    {
        return gettype($var);
    }
}