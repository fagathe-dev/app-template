<?php

namespace Fagathe\Libs\Utils\Mailer;

use Exception;
use Fagathe\Libs\File\MimeType;
use Fagathe\Libs\Helpers\Request\RequestTrait;
use Fagathe\Libs\Helpers\Validator;
use Fagathe\Libs\Logger\Logger;
use Fagathe\Libs\Logger\LoggerLevelEnum;
use Fagathe\Libs\Utils\Mailer\RecepientEnum;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\Filesystem\Filesystem;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Part\DataPart;
use Symfony\Component\Mime\Part\File;

final class MailerService
{

    private const LOG_FILE = 'mailer/mailer';
    private const DEFAULT_EMAIL_TEMPLATES_DIR = 'emails/';

    use RequestTrait;

    public function __construct(private MailerInterface $mailer)
    {
        $this->mailer = $mailer;
    }

    /**
     * Sends an email using the provided parameters.
     *
     * Example usage:
     * ```php
     * $mailerService->sendEmail(
     *     recepient: ['john@example.com' => 'John Doe', 'jane@example.com'],
     *     subject: 'Welcome!',
     *     template: 'emails/welcome.html.twig',
     *     context: ['username' => 'John'],
     *     sender: ['noreply@example.com' => 'No Reply'],
     *     cc: ['manager@example.com'],
     *     bcc: ['audit@example.com'],
     *     attachments: [
     *         ['path' => '/path/to/file1.pdf', 'name' => 'Invoice.pdf'],
     *         ['path' => '/path/to/file2.jpg']
     *     ]
     * );
     * ```
     *
     * @param array $recepient
     * @param string $subject
     * @param string $template
     * @param array $context
     * @param array|string|null $sender
     * @param null|string|array $cc
     * @param null|string|array $bcc
     * @param null|array $attachments
     */
    public function sendEmail(
        array $recepient = [],
        string $subject = '',
        string $template = '',
        array $context = [],
        array|string|null $sender = null,
        null|string|array $cc = null,
        null|string|array $bcc = null,
        null|array $attachments = null
    ): void {

        try {
            $template = $this->normalizeTemplate($template);

            $email = (new TemplatedEmail())
                ->from($this->getSender($sender))
                ->subject($subject)
                ->htmlTemplate($template);

            $email = $this->setRecepient($email, $recepient);

            if (!empty($cc)) {
                $email = $this->setRecepient($email, $cc, RecepientEnum::Cc);
            }

            if (!empty($bcc)) {
                $email = $this->setRecepient($email, $bcc, RecepientEnum::Bcc);
            }

            $email = $this->setContext($email, $context);
            $email = $this->setAttachments($email, $attachments);
            $email->embed(fopen(ROOT_DIR . 'public/images/logo-light.png', 'r'), 'logo_cid');

            $this->mailer->send($email);

            $this->generateLog(
                content: ['message' => 'Email sent successfully', 'subject' => $subject, 'recipients' => count($recepient)],
                context: ['action' => __METHOD__],
                level: LoggerLevelEnum::Info
            );
        } catch (Exception $e) {
            $this->generateLog(
                content: ['exception' => $e->getMessage(), 'subject' => $subject],
                context: ['action' => __METHOD__],
                level: LoggerLevelEnum::Error
            );
            throw new \RuntimeException('Failed to send email: ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Normalizes the template path by removing common prefixes and suffixes.
     *
     * @param string $template
     * @return string
     */
    private function normalizeTemplate(string $template): string
    {
        // Remove the default email templates directory prefix if present
        if (str_starts_with($template, static::DEFAULT_EMAIL_TEMPLATES_DIR)) {
            $template = substr($template, strlen(static::DEFAULT_EMAIL_TEMPLATES_DIR));
        }

        // Remove the .html.twig suffix if present
        if (str_ends_with($template, '.html.twig')) {
            $template = substr($template, 0, -10); // Remove '.html.twig' (10 characters)
        }

        return $template;
    }

    /**
     * Attaches files to the given TemplatedEmail instance.
     *
     * Example usage:
     * ```php
     * $email = $this->setAttachments($email, [
     *     ['path' => '/path/to/file1.pdf', 'name' => 'Invoice.pdf'],
     *     ['path' => '/path/to/file2.jpg']
     * ]);
     * ```
     *
     * @param TemplatedEmail $email
     * @param array|null $attachments
     * @return TemplatedEmail
     */
    private function setAttachments(TemplatedEmail $email, ?array $attachments): TemplatedEmail
    {
        if (empty($attachments)) {
            return $email;
        }

        $filesystem = new Filesystem();

        foreach ($attachments as $attachment) {
            $filePath = $attachment['path'] ?? null;

            if (empty($filePath)) {
                $this->generateLog(
                    content: ['exception' => 'Attachment path is missing'],
                    context: ['action' => __METHOD__],
                    level: LoggerLevelEnum::Warning
                );
                continue;
            }

            if (!$filesystem->exists($filePath)) {
                $errorMsg = "Attachment file does not exist: {$filePath}";
                $this->generateLog(
                    content: ['exception' => $errorMsg],
                    context: ['action' => __METHOD__],
                    level: LoggerLevelEnum::Error
                );
                throw new \RuntimeException($errorMsg);
            }

            $fileName = $attachment['name'] ?? basename($filePath);
            $mimeType = MimeType::guessMimetype($filePath);

            $dataPart = new DataPart(new File($filePath), $fileName, $mimeType);
            $email->addPart($dataPart);
        }

        return $email;
    }


    /**
     * Sets the context for the TemplatedEmail, merging with preset values.
     *
     * Example usage:
     * ```php
     * $email = $this->setContext($email, ['username' => 'John']);
     * ```
     *
     * @param TemplatedEmail $email
     * @param array $context
     * @return TemplatedEmail
     */
    private function setContext(TemplatedEmail $email, array $context = []): TemplatedEmail
    {
        $logoPath = ROOT_DIR . 'public/images/logo-light.png';

        if (!file_exists($logoPath)) {
            $this->generateLog(
                content: ['warning' => 'Logo file not found: ' . $logoPath],
                context: ['action' => __METHOD__],
                level: LoggerLevelEnum::Warning
            );
        }

        $presetContext = [
            'app_name' => APP_NAME,
            'base_url' => $this->getOrigin(),
            'logo' => $this->generateBase64Logo($logoPath),
        ];

        $email->context(array_merge($presetContext, $context));

        return $email;
    }

    /**
     * Generates a base64 encoded logo for email templates.
     *
     * @param string $logoPath
     * @return string
     */
    private function generateBase64Logo(string $logoPath): string
    {
        if (!file_exists($logoPath)) {
            return '';
        }

        $type = pathinfo($logoPath, PATHINFO_EXTENSION);
        $data = file_get_contents($logoPath);

        return 'data:image/' . $type . ';base64,' . base64_encode($data);
    }



    /**
     * Retrieves the sender address.
     *
     * @param array|string|null $sender The sender information, which can be an array, a string, or null.
     * @return Address|string Returns an Address object or a string representing the sender.
     *
     * Example usage:
     *   $address = $this->getSender(['john@example.com' => 'John Doe']);
     *   $address = $this->getSender('jane@example.com');
     *   $address = $this->getSender(); // uses default APP_EMAIL_CONTACT
     */
    private function getSender(array|string|null $sender = null): Address|string
    {
        if ($sender === null) {
            $sender = APP_EMAIL_CONTACT;
        }

        if (is_string($sender)) {
            return $sender;
        }

        if (is_array($sender) && !empty($sender)) {
            $email = array_keys($sender)[0];
            $name = array_values($sender)[0];

            if (Validator::isValidEmail($email)) {
                return new Address($email, $name);
            } elseif (Validator::isValidEmail($name)) {
                return new Address($name, $email);
            }
        }

        $this->generateLog(
            content: ['exception' => 'Invalid sender format', 'sender' => $sender],
            context: ['action' => __METHOD__],
            level: LoggerLevelEnum::Error
        );

        throw new \InvalidArgumentException('Invalid sender format. Expected valid email address.');
    }

    /**
     * Sets a recipient of the specified type (To, Cc, Bcc) on the given TemplatedEmail.
     *
     * @param TemplatedEmail $email The email object to which the recipient will be added.
     * @param array $recepient An associative array containing recipient information (e.g., ['email' => 'user@example.com', 'name' => 'User Name']).
     * @param RecepientEnum $type The type of recipient (To, Cc, Bcc). Defaults to RecepientEnum::To.
     * @return TemplatedEmail The updated TemplatedEmail object with the recipient set.
     *
     * @example
     * $email = new TemplatedEmail();
     * $recepient = ['John Doe' => 'john.doe@example.com'];
     * $updatedEmail = $this->setRecepient($email, $recepient, RecepientEnum::Cc);
     */
    private function setRecepient(TemplatedEmail $email, array $recipient, RecepientEnum $type = RecepientEnum::To): TemplatedEmail
    {
        if (empty($recipient)) {
            $this->generateLog(
                content: ['exception' => 'Recipient list is empty.'],
                context: ['action' => __METHOD__],
                level: LoggerLevelEnum::Error
            );
            throw new \InvalidArgumentException('Recipient list cannot be empty.');
        }

        $addresses = $this->parseRecipients($recipient);
        $this->addRecipientsToEmail($email, $addresses, $type);

        return $email;
    }

    /**
     * Parses recipient array and returns normalized address array.
     *
     * @param array $recipients
     * @return array
     */
    private function parseRecipients(array $recipients): array
    {
        $addresses = [];

        foreach ($recipients as $key => $value) {
            if (is_int($key)) {
                // Simple email: ['email@example.com']
                if (Validator::isValidEmail($value)) {
                    $addresses[] = ['address' => $value];
                } else {
                    $this->logInvalidEmail($value);
                }
            } elseif (is_string($key) || is_string($value)) {
                // Named email: ['email@example.com' => 'Name'] or ['Name' => 'email@example.com']
                if (Validator::isValidEmail($key)) {
                    $addresses[] = ['address' => $key, 'name' => $value];
                } elseif (Validator::isValidEmail($value)) {
                    $addresses[] = ['address' => $value, 'name' => $key];
                } else {
                    $this->logInvalidEmail($key ?: $value);
                }
            }
        }

        return $addresses;
    }

    /**
     * Adds recipients to email based on type.
     *
     * @param TemplatedEmail $email
     * @param array $addresses
     * @param RecepientEnum $type
     * @return void
     */
    private function addRecipientsToEmail(TemplatedEmail $email, array $addresses, RecepientEnum $type): void
    {
        foreach ($addresses as $index => $address) {
            $recipient = isset($address['name'])
                ? new Address($address['address'], $address['name'])
                : $address['address'];

            $isFirst = $index === 0;

            match ($type) {
                RecepientEnum::To => $isFirst ? $email->to($recipient) : $email->addTo($recipient),
                RecepientEnum::Cc => $isFirst ? $email->cc($recipient) : $email->addCc($recipient),
                RecepientEnum::Bcc => $isFirst ? $email->bcc($recipient) : $email->addBcc($recipient),
                default => throw new \InvalidArgumentException('Invalid recipient type: ' . $type->value)
            };
        }
    }

    /**
     * Logs invalid email error.
     *
     * @param string $email
     * @return void
     */
    private function logInvalidEmail(string $email): void
    {
        $this->generateLog(
            content: ['exception' => 'Invalid email address: ' . $email],
            context: ['action' => __METHOD__],
            level: LoggerLevelEnum::Error
        );
        throw new \InvalidArgumentException('Invalid email address: ' . $email);
    }

    /**
     * @param array $content
     * @param array $context
     * @param LoggerLevelEnum $level
     * 
     * @return void
     */
    private function generateLog(array $content, array $context = [], LoggerLevelEnum $level = LoggerLevelEnum::Error): void
    {
        $logger = new Logger(self::LOG_FILE);
        $logger->log($level, $content, $context);
    }
}
