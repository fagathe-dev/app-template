<?php

namespace Fagathe\Libs\Twig;

use Fagathe\Libs\Logger\Log;
use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

class LoggerExtension extends AbstractExtension
{
    public function getFunctions(): array
    {
        return [
            new TwigFunction("generate_logger_template", [$this, "generateLoggerTemplate"], ['is_safe' => ['html']]),
        ];
    }

    public function generateLoggerTemplate(?Log $log): string
    {
        return $log->generate();
    }
}
