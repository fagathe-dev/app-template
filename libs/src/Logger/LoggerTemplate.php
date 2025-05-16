<?php

namespace Fagathe\Libs\Logger;

use Fagathe\Libs\DetectDevice\BrowserEnum;
use Fagathe\Libs\DetectDevice\DeviceEnum;
use Fagathe\Libs\Logger\Log;

final class LoggerTemplate
{
    private string $html = '';

    private const PHONE_ICON = 'ri-smartphone-line';
    private const TABLET_ICON = 'ri-tablet-line';
    private const DESKTOP_ICON = 'ri-computer-line';
    private const HEADER_TEMPLATE_SEPARATOR_TEXT = '&nbsp;:&nbsp;';
    private const HEADER_TEMPLATE_SEPARATOR_PARTS = '&nbsp;-&nbsp;';
    private const NO_MARGIN_BOTTOM_CLASS = 'mb-0';
    private string $htmlID = '';

    public function __construct(private Log $log)
    {
        $this->generateID();
    }

    /**
     * Gets the generated HTML.
     *
     * @return string The generated HTML.
     */
    private function getHTML(): string
    {
        return $this->html;
    }

    /**
     * Adds HTML content to the existing HTML.
     *
     * @param string $html The HTML content to add.
     * @return self
     */
    private function addHTML(string $html): self
    {
        $this->html .= $html;

        return $this;
    }

    /**
     * Starts the HTML template.
     *
     * @return void
     */
    private function start(): void
    {
        $this->addHTML('<div class="row"><div class="col-lg-12"><div class="card">');
    }

    /**
     * Ends the HTML template.
     *
     * @return void
     */
    private function end(): void
    {
        $this->addHTML('</div></div></div>');
    }

    /**
     * Checks if the log has content to display.
     *
     * @return bool True if the log has content, false otherwise.
     */
    private function hasContent(): bool
    {
        return $this->log->hasContext('action') || $this->log->hasContext('uid') || is_array($this->log->getContents() && count($this->log->getContents()) > 0);
    }

    /**
     * Generates the header section of the log template.
     *
     * @return void
     */
    private function generateHeader(): void
    {
        $logLevel = $this->log->getLevel();
        $color = match ($logLevel) {
            LoggerLevelEnum::Error, LoggerLevelEnum::Critical => 'danger',
            LoggerLevelEnum::Warning => 'warning',
            default => 'info',
        };
        $extra = '';

        if ($this->hasContent()) {
            $extra = ' data-bs-toggle="collapse" data-bs-target="#' . $this->getHtmlID() . '" role="button" aria-expanded="false" aria-controls="' . $this->getHtmlID() . '"';
        }

        $html = '<div class="card-header align-items-center d-flex"' . $extra . '><div class="flex-grow-1"><p class="card-text ' . static::NO_MARGIN_BOTTOM_CLASS . '">';
        $parts = ['<strong class="text-' . $color . '">' . strtoupper($logLevel->value) . '</strong>'];
        $content = '';
        if ($this->log->hasContext('browser') && $this->log->hasContext('device')) {
            $device = match ($this->log->getContext('device')) {
                DeviceEnum::Mobile->value => static::PHONE_ICON,
                DeviceEnum::Tablet->value => static::TABLET_ICON,
                default => static::DESKTOP_ICON,
            };
            $browser = $this->log->getContext('browser');
            $parts[] = '<span><i class="' . $device . '"></i>&nbsp;:&nbsp;' . $browser . '</span>';
        }

        if ($this->log->hasContext('ip')) {
            $parts[] = '<span>IP' . static::HEADER_TEMPLATE_SEPARATOR_TEXT . $this->log->getContext('ip') . '</span>';
        }

        $parts = [
            ...$parts,
            '<span>' . $this->log->getTimestamp()->format('d-m-Y H:i:s') . '</span>',
            '<span class="text-muted">' . $this->log->getOrigin() . '</span>',
        ];

        $html .= join(static::HEADER_TEMPLATE_SEPARATOR_PARTS, $parts);
        $html .= '</p></div></div>';

        $this->addHTML($html);
    }

    /**
     * Generates the content section of the log template.
     *
     * @return void
     */
    private function generateContent(): void
    {
        $html = '<div class="card-body collapse" id="' . $this->getHtmlID() . '">';
        $titleClass = 'text-dark fw-bold';
        $withoutMarginBottom = $titleClass . ' ' . static::NO_MARGIN_BOTTOM_CLASS;

        if ($this->log->hasContext('uid')) {
            $html .= '<p class="' . $withoutMarginBottom . '">Utilisateur : </p><p>' . $this->log->getContext('uid') . '<p>';
        }

        if ($this->log->hasContent('message')) {
            $html .= '<p class="' . $withoutMarginBottom . '">Message : </p><p class="text-muted">' . $this->log->getContent('message') . '<p>';
        }

        if ($this->log->hasContent('data')) {
            $html .= '<p class="' . $titleClass . '">Data : </p><div class="live-preview"><pre><code class="language-json">' . htmlentities(json_encode($this->log->getContent('data'), JSON_PRETTY_PRINT), ENT_QUOTES, 'UTF-8') . '</code></pre></div>';
        }

        if ($this->log->hasContent('exception')) {
            $html .= '<p class="' . $titleClass . '">Exception : </p><div class="live-preview"><pre><code class="language-json">' . htmlentities(json_encode($this->log->getContent('exception'), JSON_PRETTY_PRINT), ENT_QUOTES, 'UTF-8') . '</code></pre></div>';
        }

        if ($this->log->hasContent('ws_return')) {
            $html .= '<p class="' . $titleClass . '">Retour WS : </p><div class="live-preview"><pre><code class="language-json">' . htmlentities(json_encode($this->log->getContent('ws_return'), JSON_PRETTY_PRINT), ENT_QUOTES, 'UTF-8') . '</code></pre></div>';
        }

        $html .= '</div>';
        $this->addHTML($html);
    }

    /**
     * Gets the HTML ID for the log template.
     *
     * @return string The HTML ID.
     */
    private function getHtmlID(): string
    {
        return $this->htmlID;
    }

    /**
     * Sets the HTML ID for the log template.
     *
     * @param string $htmlID The HTML ID to set.
     * @return self
     */
    private function setHtmlID(string $htmlID): self
    {
        $this->htmlID = $htmlID;
        return $this;
    }

    /**
     * Generates a unique HTML ID for the log template.
     *
     * @return void
     */
    private function generateID(): void
    {
        $this->setHtmlID(strtoupper($this->log->getLevel()->value) . '_' . $this->log->getTimestamp()->format('YmdHis'));
    }

    /**
     * Generates the complete log template.
     *
     * @return string The generated log template as HTML.
     */
    public function generateTemplate(): string
    {
        $this->start();
        $this->generateHeader();
        $this->generateContent();
        $this->end();
        return $this->getHTML();
    }
}
