<?php

namespace Fagathe\Libs\Utils\Mailer;

use Fagathe\Libs\Helpers\Request\RequestTrait;

final class Email
{

    use RequestTrait;

    private const DEFAULT_EMAIL_TEMPLATES_DIR = 'emails/';
    private bool $preview = true;

    public function __construct(
        private string $name,
        private string $action,
        private string $template = '',
        private array $context = [],
    ) {}

    /**
     * Get the name of the email.
     *
     * @return string
     */
    public function getName(): string
    {
        return $this->name;
    }

    /**
     * Get the action of the email.
     *
     * @return string
     */
    public function getAction(): string
    {
        return $this->action;
    }

    public function getContext(): array
    {
        $origin = $this->getOrigin();
        $logo_path = ROOT_DIR . 'public/images/logo-light.png'; // Default logo URL
        $type = pathinfo($logo_path, PATHINFO_EXTENSION);
        $data = file_get_contents($logo_path);

        $presetContext = [
            'app_name' => APP_NAME,
            'base_url' => $this->getOrigin(),
            'logo' => 'data:image/' . $type . ';base64,' . base64_encode($data),
        ];

        $context = array_merge($presetContext, $this->context);

        return $context;
    }

    public function getTemplate(): string
    {
        return static::DEFAULT_EMAIL_TEMPLATES_DIR . $this->template . '.html.twig';
    }

    public function isPreview(): bool
    {
        return $this->preview;
    }
}
