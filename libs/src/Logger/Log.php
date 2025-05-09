<?php

final class Log
{
    private string $level;
    private string $content;
    private array $context = [];
    private DateTimeImmutable $timestamp;

    public function __construct() {}

    /**
     * Gets the log level.
     *
     * @return string The log level.
     */
    public function getLevel(): string
    {
        return $this->level;
    }

    /**
     * Sets the log level.
     *
     * @param string $level The log level to set.
     * @return self
     */
    public function setLevel(string $level): self
    {
        $this->level = $level;

        return $this;
    }

    /**
     * Gets the log content.
     *
     * @return string The log content.
     */
    public function getContent(): string
    {
        return $this->content;
    }

    /**
     * Sets the log content.
     *
     * @param string $content The log content to set.
     * @return self
     */
    public function setContent(string $content): self
    {
        $this->content = $content;

        return $this;
    }

    /**
     * Gets the log context.
     *
     * @return array The log context.
     */
    public function getContext(): array
    {
        return $this->context;
    }

    /**
     * Sets the log context.
     *
     * @param array $context The log context to set.
     * 
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
     * @param string $key The context key.
     * @param mixed $value The context value.
     * 
     * @return self
     */
    public function addContext(string $key, mixed $value): self
    {
        $this->context[$key] = $value;

        return $this;
    }

    /**
     * Gets the timestamp of the log.
     *
     * @return DateTimeImmutable The timestamp of the log.
     */
    public function getTimestamp(): DateTimeImmutable
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
    public function setTimestamp(?DateTimeImmutable $timestamp): self
    {
        $this->timestamp = $timestamp;

        return $this;
    }
}
