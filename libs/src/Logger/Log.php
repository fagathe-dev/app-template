<?php

namespace Fagathe\Libs\Logger;

use DateTimeImmutable;
use Fagathe\Libs\Logger\LoggerLevelEnum;

final class Log
{
    public const CONTEXT_KEYS = ['ip', 'device', 'browser', 'action', 'user_id'];

    public const CONTENT_KEYS = ['data', 'exception', 'message', 'ws_return'];

    private string|int|null $id = null;

    private ?LoggerLevelEnum $level = null;

    /**
     * @var array<string, mixed> The log context.
     */
    private array $content = [];

    /**
     * @var array<string, string> The log context.
     */
    private array $context = [];

    /**
     * @var DateTimeImmutable The timestamp of the log.
     */
    private ?DateTimeImmutable $timestamp = null;

    private ?string $origin = null;

    public function __construct() {}

    /**
     * Gets the log ID.
     *
     * @return string|int|null The log ID.
     */
    public function getId(): string|int|null
    {
        return $this->id;
    }

    /**
     * Sets the log ID.
     *
     * @param string|int $id The log ID to set.
     * @return self
     */
    public function setId(string|int|null $id = null): self
    {
        $this->id = $id;

        return $this;
    }

    /**
     * Gets the log level.
     *
     * @return LoggerLevelEnum The log level.
     */
    public function getLevel(): ?LoggerLevelEnum
    {
        return $this->level;
    }

    /**
     * Sets the log level.
     *
     * @param LoggerLevelEnum $level The log level to set.
     * @return self
     */
    public function setLevel(LoggerLevelEnum $level): self
    {
        $this->level = $level;

        return $this;
    }

    /**
     * Gets the log content.
     * @param string $key
     * 
     * @return mixed The log content.
     */
    public function getContent(string $key): mixed
    {
        return $this->content[$key];
    }

    /**
     * Gets the log content.
     * 
     * @return array The log content.
     */
    public function getContents(): ?array
    {
        return $this->content;
    }

    /**
     * Sets the log content.
     *
     * This method replaces the entire content array with the provided array.
     *
     * @param array<string, mixed> $content The content array to set.
     * @return self
     */
    public function setContent(array $content): self
    {
        $this->content = $content;

        return $this;
    }

    /**
     * Adds a key-value pair to the log content.
     *
     * The `$key` must be one of the following valid options:
     * - `data`: Used to store additional data related to the log.
     * - `exception`: Used to store exception details.
     * - `message`: Used to store a log message.
     * - `ws_return`: Used to store the return value of a web service.
     *
     * @param string $key The content key. Must be one of `data`, `exception`, `message`, or `ws_return`.
     * @param mixed $value The content value associated with the key.
     * @return self
     *
     * @throws \InvalidArgumentException If the provided key is not valid.
     */
    public function addContent(string $key, mixed $value): self
    {
        if (!in_array($key, self::CONTENT_KEYS)) {
            throw new \InvalidArgumentException(sprintf(
                'Invalid content key: `%s`. Valid keys are: %s.',
                $key,
                join(', ', self::CONTENT_KEYS)
            ));
        }

        $this->content[$key] = $value;

        return $this;
    }

    /**
     * @param string $key
     * 
     * @return bool
     */
    public function hasContent(string $key): bool
    {
        return array_key_exists($key, $this->content);
    }

    /**
     * Gets the log context.
     * @param string $key
     * 
     * @return mixed The log context.
     */
    public function getContext(string $key): mixed
    {
        return $this->context[$key];
    }

    /**
     * Gets the log context.
     * 
     * @return array The log content.
     */
    public function getContexts(): ?array
    {
        return $this->context;
    }

    /**
     * Sets the log context.
     *
     * This method replaces the entire context array with the provided array.
     *
     * @param array<string, string> $context The context array to set.
     * @return self
     */
    public function setContext(array $context): self
    {
        $this->context = $context;

        return $this;
    }

    /**
     * Adds a key-value pair to the log context.
     *
     * The `$key` must be one of the following valid options:
     * - `ip`: The IP address of the user or system.
     * - `device`: The type of device (e.g., mobile, tablet, desktop).
     * - `browser`: The browser used by the user.
     * - `action`: The action performed (e.g., login, logout).
     * - `user_id`: The ID of the user associated with the log.
     *
     * @param string $key The context key. Must be one of `ip`, `device`, `browser`, `action`, or `user_id`.
     * @param mixed $value The context value associated with the key.
     * @return self
     *
     * @throws \InvalidArgumentException If the provided key is not valid.
     */
    public function addContext(string $key, mixed $value): self
    {
        if (!in_array($key, self::CONTEXT_KEYS)) {
            throw new \InvalidArgumentException(sprintf(
                'Invalid context key: `%s`. Valid keys are: %s.',
                $key,
                join(', ', self::CONTEXT_KEYS)
            ));
        }

        $this->context[$key] = $value;

        return $this;
    }

    /**
     * @param string $key
     * 
     * @return bool
     */
    public function hasContext(string $key): bool
    {
        return array_key_exists($key, $this->context);
    }

    /**
     * Gets the timestamp of the log.
     *
     * @return DateTimeImmutable The timestamp of the log.
     */
    public function getTimestamp(): ?DateTimeImmutable
    {
        return $this->timestamp;
    }

    /**
     * Sets the timestamp of the log.
     *
     * @param null|DateTimeImmutable $timestamp The timestamp to set.
     * 
     * @return self
     */
    public function setTimestamp(DateTimeImmutable $timestamp): self
    {
        $this->timestamp = $timestamp;

        return $this;
    }

    /**
     * Generates the log template as a string.
     *
     * @return string The generated log template.
     */
    public function generate(): string
    {
        return (new LoggerTemplate($this))->generateTemplate();
    }

    /**
     * Gets the origin of the log.
     *
     * @return string The origin of the log.
     */
    public function getOrigin(): ?string
    {
        return $this->origin;
    }

    /**
     * Sets the origin of the log.
     *
     * @param string $origin The origin to set.
     * @return self
     */
    public function setOrigin(string $origin): self
    {
        $this->origin = $origin;

        return $this;
    }
}
