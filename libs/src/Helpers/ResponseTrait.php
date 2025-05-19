<?php

namespace Fagathe\Libs\Helpers;

use stdClass;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Session\Session;
use Symfony\Component\Validator\ConstraintViolationList;

trait ResponseTrait
{

    /**
     * @param array $data
     * @param int $status
     * @param array $headers
     *
     * @return object
     */
    public function sendJson($data = [], int $status = Response::HTTP_OK, $headers = []): object
    {
        $response = new stdClass;
        $response->data = $data;
        $response->status = $status;
        $response->headers = $headers;

        return $response;
    }

    /**
     * @return object
     */
    public function sendNoContent(array $headers = []): object
    {
        return $this->sendJson([], Response::HTTP_NO_CONTENT, $headers);
    }

    /**
     * @param ConstraintViolationList $violations
     * @param array $headers
     *
     * @return object|null
     */
    public function sendViolations(ConstraintViolationList $violations, array $headers = []): ?object
    {

        return $this->sendJson(
            [
                'title' => 'Validation failed !',
                'violations' => $this->filterViolations($violations),
            ],
            Response::HTTP_BAD_REQUEST,
            $headers
        );
    }

    /**
     * @param ConstraintViolationList $violations
     * 
     * @return array
     */
    public function filterViolations(ConstraintViolationList $violations): array
    {
        $errors = [];

        if (count($violations) > 0) {

            foreach ($violations as $violation) {
                $errors[$violation->getPropertyPath()] = $violation->getMessage();
            }
        }

        return $errors;
    }

    /**
     * @param string $message
     * @param string $type
     * 
     * @return void
     */
    public function addFlash(string $message, string $type = 'info'): void
    {
        $session = new Session;
        $session->getFlashBag()->add($type, $message);
    }
}
