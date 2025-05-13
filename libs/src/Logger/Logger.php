<?php

namespace Fagathe\Libs\Logger;

use DateTimeImmutable;
use Fagathe\Libs\DetectDevice\DetectDevice;
use Fagathe\Libs\Helpers\IPChecker;
use Fagathe\Libs\JSON\JsonSerializer;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Session\Session;

final class Logger
{

    private Request $request;
    private JsonLogService $jsonLogService;
    private JsonSerializer $jsonSerializer;
    private DetectDevice $detectDevice;
    private IPChecker $ipChecker;
    private Session $session;

    public function __construct(private string $filePath)
    {
        $this->init();
    }

    /**
     * @return void
     */
    private function init(): void
    {
        $this->request = Request::createFromGlobals();
        $this->filePath = $this->filePath . '-' . (new DateTimeImmutable())->format('d-m-Y');
        $this->jsonLogService = new JsonLogService($this->filePath);
        $this->jsonSerializer = new JsonSerializer();
        $this->detectDevice = new DetectDevice();
        $this->ipChecker = new IPChecker();
        $this->session = new Session();
        $this->session->start();
    }

    /**
     * @param array $content
     * @param array $context
     * 
     * @return void
     */
    public function info(array $content = [], array $context = []): void
    {
        $this->log(LoggerLevelEnum::Info, $content, $context);
    }

    /**
     * @param array $content
     * @param array $context
     * 
     * @return void
     */
    public function error(array $content = [], array $context = []): void
    {
        $this->log(LoggerLevelEnum::Error, $content, $context);
    }

    /**
     * @param array $content
     * @param array $context
     * 
     * @return void
     */
    public function warning(array $content = [], array $context = []): void
    {
        $this->log(LoggerLevelEnum::Warning, $content, $context);
    }

    /**
     * @param array $content
     * @param array $context
     * 
     * @return void
     */
    public function debug(array $content = [], array $context = []): void
    {
        $this->log(LoggerLevelEnum::Debug, $content, $context);
    }

    /**
     * @param array $content
     * @param array $context
     * 
     * @return void
     */
    public function critical(array $content = [], array $context = []): void
    {
        $this->log(LoggerLevelEnum::Critical, $content, $context);
    }

    /**
     * @param array $content
     * @param array $context
     * 
     * @return void
     */
    public function notice(array $content = [], array $context = []): void
    {
        $this->log(LoggerLevelEnum::Notice, $content, $context);
    }

    /**
     * Logs a message with a specified logging level, content, and context.
     *
     * @param LoggerLevelEnum $level The logging level (e.g., Info, Warning, Error). Defaults to LoggerLevelEnum::Info.
     * @param array $content The main content of the log message, typically an array of key-value pairs.
     * @param array $context Additional context for the log message, such as metadata or debugging information.
     *
     * @return void
     *
     * @example
     * // Example 1: Log an informational message
     * $logger->log(LoggerLevelEnum::Info, ['message' => 'Application started']);
     *
     * @example
     * // Example 2: Log a warning with additional context
     * $logger->log(
     *     LoggerLevelEnum::Warning,
     *     ['message' => 'Configuration file missing'],
     *     ['filePath' => '/etc/app/config.yaml']
     * );
     *
     * @example
     * // Example 3: Log an error with detailed content and context
     * $logger->log(
     *     LoggerLevelEnum::Error,
     *     ['message' => 'Database connection failed', 'errorCode' => 500],
     *     ['host' => 'localhost', 'port' => 3306]
     * );
     */
    public function log(LoggerLevelEnum $level = LoggerLevelEnum::Info, array $content = [], array $context = []): void
    {
        $dateTime = new DateTimeImmutable();
        $log = (new Log())
            ->setLevel($level)
            ->setContent($content)
            ->setContext($this->getContext())
            ->setTimestamp($dateTime)
            ->setOrigin($this->getOrigin())
            ->setId('LOG_' . $dateTime->format('YmdHis'));

        foreach ($context as $key => $value) {
            if (in_array($key, Log::CONTEXT_KEYS)) {
                $log->addContext($key, $value);
            } elseif (in_array($key, Log::CONTENT_KEYS)) {
                $log->addContent($key, $value);
            }
        }

        if ($this->getUserContext() !== null) {
            $log->addContext('user_id', $this->getUserContext());
        }

        $log = $this->jsonSerializer->normalize($log);


        $this->jsonLogService->add($log);
    }

    /**
     * @return array
     */
    private function getContext(): array
    {
        return [
            'ip' => $this->ipChecker->getIp(), // (eg. '66.39.189.44')
            'device' => $this->detectDevice->getDeviceType()->value,
            'browser' => $this->detectDevice->getBrowser()->value,
        ];
    }

    /**
     * @return string|null
     */
    private function getUserContext(): ?string
    {
        if (!$this->session->has('userContext')) {
            return null;
        }

        return $this->session->get('userContext'); # TODO: Définir une constante dans l'authenticator pour l'ID de l'utilisateur
    }

    /**
     * @return string|null
     */
    private function getOrigin(): ?string
    {
        return $this->request->getSchemeAndHttpHost() . $this->request->getPathInfo();
    }
}
