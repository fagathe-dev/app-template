<?php

namespace App\Controller;

use App\Entity\Seo;
use App\Entity\SeoTag;
use Fagathe\Libs\Helpers\String\RefGenerator;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class AdminController extends AbstractController
{

    use RefGenerator;

    public function __construct() {}

    #[Route('/admin', name: 'admin')]
    public function index(Request $request): Response
    {
        $seo = new Seo();
        $seo->setRef($this->generateRef('SEO'))
            ->setTitle('Home - Admin')
            ->setDescription('Lorem ipsum dolor sit, amet consectetur adipisicing elit. Dolores accusamus optio rem repudiandae maxime, omnis odit? Necessitatibus asperiores, similique ipsam eum omnis odit libero quos, sequi culpa nostrum, accusantium numquam.')
            ->addTag((new SeoTag)
                    ->setName('robots')
                    ->setAttribute('name')
                    ->setContent('index, follow')
            )
            ->setKeywords([
                'admin',
                'dashboard',
                'symfony',
                'php',
            ])
        ;

        return $this->render('admin/index.html.twig', ['seo' => $seo]);
    }
}
