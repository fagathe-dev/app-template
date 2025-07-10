<?php
namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api', name: 'api_')]
final class APIController extends AbstractController
{
    #[Route('/test', name: 'test')]
    public function test(): JsonResponse
    {
        return new JsonResponse(['message' => 'API is working!']);
    }

    // Add more API endpoints as needed
}