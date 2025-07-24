<?php

namespace Fagathe\Libs\Twig;

use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

class AssetExtension extends AbstractExtension
{

    public function __construct(
        #[Autowire('%kernel.environment%')]
        private readonly string $env
    ) {
        // Constructor code if needed
    }

    public function getFunctions(): array
    {
        return [
            new TwigFunction("app_template_asset", [$this, "appTemplateAsset"]),
        ];
    }

    /**
     * @param string $asset
     * 
     * @return string
     */
    public function appTemplateAsset(string $asset): string
    {
        if ($this->env === 'dev') {
            return '/' . $asset;
        }

        if (APP_DS_ASSET_BUILD) {
            $parts = explode('/', $asset);
            $fileNameExtension = end($parts);
            $fileExtension = explode('.', $fileNameExtension)[1];
            $fileName = explode('.', $fileNameExtension)[0];
            if (str_contains($asset, 'js/')) {
                $asset = str_replace('js/', 'js-mini/', $asset);
                $asset = str_replace($fileNameExtension, $fileName . '.min.' . $fileExtension, $asset);
            }
            if (str_contains($asset, 'css/')) {
                $asset = str_replace('css/', 'css-mini/', $asset);
                $asset = str_replace($fileNameExtension, $fileName . '.min.' . $fileExtension, $asset);
            }
        }

        return '/' . $asset;
    }
}
