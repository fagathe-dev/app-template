<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api', name: 'api_')]
final class APIController extends AbstractController
{
    #[Route('/test', name: 'test')]
    public function test(Request $request): Response
    {
        $type = $request->query->get('type', 'json');
        $message = 'API is working!';

        if ($type === 'binary') {
            // Chemin vers un fichier existant sur votre serveur Symfony
            // Pour cet exemple, nous allons créer un fichier temporaire simple.
            // En production, vous mettriez le chemin vers votre vrai fichier (ex: $this->getParameter('kernel.project_dir') . '/public/files/mon_fichier.pdf')

            $filePath = 'tmp.txt';
            file_put_contents($filePath, "Ceci est un exemple de fichier texte pour le téléchargement.\n");
            file_put_contents($filePath, "Il contient quelques lignes de données.\n", FILE_APPEND);

            // Crée une BinaryFileResponse
            $response = new BinaryFileResponse($filePath);

            // Définit le nom du fichier qui sera proposé au téléchargement par le navigateur
            $response->setContentDisposition(
                ResponseHeaderBag::DISPOSITION_ATTACHMENT,
                'mon_fichier_telecharge.txt' // Nom du fichier tel que l'utilisateur le verra
            );

            // (Optionnel) Définit le type MIME du fichier
            // Symfony essaiera de le deviner, mais vous pouvez le forcer
            $response->headers->set('Content-Type', 'text/plain');

            // (Optionnel) Supprime le fichier temporaire après l'envoi
            // Si c'est un fichier temporaire ou généré à la volée
            $response->deleteFileAfterSend(true);

            return $response;
        }

        if ($type === 'html') {

            $html = $this->renderView('api/test.html.twig', [
                'name' => $request->query->get('name', 'les gens')
            ]);

            return $this->json(compact('html, message'));
        }

        return $this->json(compact('message'));
    }

    // Add more API endpoints as needed
}
