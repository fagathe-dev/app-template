<?php

namespace Fagathe\Libs\Twig;

use App\Entity\Seo;
use Fagathe\Libs\SEO\SeoService;
use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

class SeoExtension extends AbstractExtension
{
    public function getFunctions(): array
    {
        return [
            new TwigFunction("generate_seo", [$this, "generateSeo"], ['is_safe' => ['html']]),
        ];
    }

    public function generateSeo(?Seo $seo = null): string
    {
        return (new SeoService($seo))->generateTags();
    }
}
