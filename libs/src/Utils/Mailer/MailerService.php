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
            $email = (new TemplatedEmail);
            $email->from($this->getSender($sender));
            $email = $this->setRecepient($email, $recepient);
            if (!empty($cc)) {
                $email = $this->setRecepient($email, $cc, RecepientEnum::Cc);
            }
            if (!empty($bcc)) {
                $email = $this->setRecepient($email, $bcc, RecepientEnum::Bcc);
            }
            $email->subject($subject);
            $email->htmlTemplate(static::DEFAULT_EMAIL_TEMPLATES_DIR . $template . '.html.twig');
            $email = $this->setContext($email, $context);
            $email = $this->setAttachments($email, $attachments);
            $email->embed(fopen(ROOT_DIR . 'public/images/logo-light.png', 'r'), 'logo_cid');

            $this->mailer->send($email);
        } catch (Exception $e) {
            $this->generateLog(
                content: ['exception' => $e->getMessage()],
                context: ['action' => __METHOD__],
                level: LoggerLevelEnum::Error
            );
            throw new \RuntimeException('Failed to send email: ' . $e->getMessage());
        }
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
        $filesystem = new Filesystem;

        if (!is_null($attachments)) {
            foreach ($attachments as $key => $attachment) {
                $file_path = $attachment['path'] ?? null;
                if ($filesystem->exists($file_path)) {
                    $file_name = $attachment['name'] ?? basename($file_path);
                    $file_mime_type = MimeType::guessMimetype($file_path);

                    $dataPart = new DataPart(new File($file_path), $file_name, $file_mime_type);
                    $email->addPart($dataPart);
                } else {
                    $this->generateLog(
                        content: ['exception' => 'Attachment file does not exist: ' . $file_path],
                        context: ['action' => __METHOD__],
                        level: LoggerLevelEnum::Error
                    );
                    throw new \RuntimeException('Attachment file does not exist: ' . $file_path);
                }
            }
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
        $origin = $this->getOrigin();
        $logo_path = ROOT_DIR . 'public/images/logo-light.png'; // Default logo URL
        $type = pathinfo($logo_path, PATHINFO_EXTENSION);
        $data = file_get_contents($logo_path);
        $presetContext = [
            'app_name' => APP_NAME,
            'base_url' => $origin,
            'logo' => 'data:image/' . $type . ';base64,' . base64_encode($data),
        ];

        $context = array_merge($presetContext, $context);
        $email->context($context);

        return $email;
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
        if (is_null($sender)) {
            $sender = APP_EMAIL_CONTACT;
        }

        if (is_array($sender)) {
            $key = array_keys($sender)[0];
            $value = array_values($sender)[0];

            if (Validator::isValidEmail($key)) {
                $sender = new Address($key, $value);
            } elseif (Validator::isValidEmail($value)) {
                $sender = new Address($value, $key);
            }
        }

        if (!is_string($sender) && !is_array($sender) && !$sender instanceof Address) {
            $this->generateLog(
                content: ['exception' => 'Invalid sender format. Expected array or string.'],
                context: ['action' => __METHOD__],
                level: LoggerLevelEnum::Error
            );
            throw new \InvalidArgumentException('Invalid sender format. Expected array or string.');
        }

        return $sender;
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
     * $recepient = ['email' => 'john.doe@example.com', 'name' => 'John Doe'];
     * $updatedEmail = $this->setRecepient($email, $recepient, RecepientEnum::Cc);
     */
    private function setRecepient(TemplatedEmail $email, array $recepient, RecepientEnum $type = RecepientEnum::To): TemplatedEmail
    {
        if (empty($recepient)) {
            $this->generateLog(
                content: ['exception' => 'Recipient list is empty.'],
                context: ['action' => __METHOD__],
                level: LoggerLevelEnum::Error
            );
            throw new \InvalidArgumentException('Recipient list cannot be empty.');
        }

        $addresses = [];

        foreach ($recepient as $key => $value) {
            $eMail = [];

            if (is_int($key)) {
                if (Validator::isValidEmail($value)) {
                    $eMail = ['address' => $value];
                } else {
                    $this->generateLog(
                        content: ['exception' => 'Invalid email address: ' . $value],
                        context: ['action' => __METHOD__],
                        level: LoggerLevelEnum::Error
                    );
                    throw new \InvalidArgumentException('Invalid email address: ' . $value);
                }
                array_push($addresses, $eMail);
            }

            if (is_string($key) || is_string($value)) {
                // If the key is a valid email address, use it as the address
                if (Validator::isValidEmail($key)) {
                    $eMail = ['address' => $key, 'name' => $value];
                    // If the value is a valid email address, use it as the address
                } elseif (Validator::isValidEmail($value)) {
                    $eMail = ['address' => $value, 'name' => $key];
                } else {
                    $this->generateLog(
                        content: ['exception' => 'Invalid email address: ' . Validator::isValidEmail($key) ? $key : $value],
                        context: ['action' => __METHOD__],
                        level: LoggerLevelEnum::Error
                    );
                    throw new \InvalidArgumentException('Invalid email address: ' . $key);
                }
                array_push($addresses, $eMail);
            }
        }

        foreach ($addresses as $key => $address) {
            $keys = array_keys($address);
            $recepient = null;

            if (in_array('name', $keys)) {
                $recepient = new Address($address['address'], $address['name']);
            } else {
                $recepient = $address['address'];
            }

            if ($key === 0) {
                if ($type === RecepientEnum::To) {
                    $email->to($recepient);
                } elseif ($type === RecepientEnum::Cc) {
                    $email->cc($recepient);
                } elseif ($type === RecepientEnum::Bcc) {
                    $email->bcc($recepient);
                } else {
                    $this->generateLog(
                        content: ['exception' => 'Invalid recipient type: ' . $type],
                        context: ['action' => __METHOD__],
                        level: LoggerLevelEnum::Error
                    );
                    throw new \InvalidArgumentException('Invalid recipient type: ' . $type);
                }
            } else {
                if ($type === RecepientEnum::To) {
                    $email->addTo($recepient);
                } elseif ($type === RecepientEnum::Cc) {
                    $email->addCc($recepient);
                } elseif ($type === RecepientEnum::Bcc) {
                    $email->addBcc($recepient);
                } else {
                    $this->generateLog(
                        content: ['exception' => 'Invalid recipient type: ' . $type],
                        context: ['action' => __METHOD__],
                        level: LoggerLevelEnum::Error
                    );
                    throw new \InvalidArgumentException('Invalid recipient type: ' . $type);
                }
            }
            $email->addTo($recepient);
        }

        return $email;
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
