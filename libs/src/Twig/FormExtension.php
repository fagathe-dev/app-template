<?php

namespace Fagathe\Libs\Twig;

use Fagathe\Libs\Helpers\String\SlugTrait;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

class FormExtension extends AbstractExtension
{

    use SlugTrait;

    public function __construct(
        #[Autowire('%kernel.environment%')]
        private readonly string $env
    ) {
        // Constructor code if needed
    }

    public function getFunctions(): array
    {
        return [
            new TwigFunction("form_select", [$this, "formSelect"], ["is_safe" => ["html"]]),
        ];
    }

    public function formSelect(string $name = '', array $options = []): string
    {
        $isMultiple = $options['multiple'] ?? false;
        $placeholder = $options['placeholder'] ?? null;
        $name = $this->slugify($name);
        $id = $options['id'] ?? $name;
        $label = $options['label'] ?? $name;
        $value = $options['value'] ?? null;
        $choices = $options['choices'] ?? [];
        $required = $options['required'] ?? false;
        $onChange = $options['onChange'] ?? null;
        $class = $options['class'] ?? null;

        $attributes = [];

        if ($required) {
            $attributes[] = 'required';
        }

        if ($onChange) {
            $attributes[] = 'onchange="' . htmlspecialchars($onChange) . '"';
        }

        if ($id) {
            $attributes[] = 'id="' . htmlspecialchars($id) . '"';
        }

        if($isMultiple) {
            $attributes[] = 'multiple';
        }

        $html = '<div class="mb-3">';
        $html .= '<label for="' . $name . '">' . htmlspecialchars($label) . '</label>';

        $html .= '<select class="form-select ' . $class . '" ' . join(' ', $attributes) .'>';

        if ($placeholder) {
            $html .= '<option value="">' . $placeholder . '</option>';
        }


        foreach ($choices as $k => $v) {
            $selected = is_array($value) ? in_array($k, $value) : $k === $value;
            $html .= '<option value="' . htmlspecialchars($k) . '"' . ($selected ? ' selected' : '') . '>' . htmlspecialchars($v) . '</option>';
        }


        $html .= '</select>';
        $html .= '</div>';

        return $html;
    }
}
