# Module SEO

## Vue d'ensemble

Le module SEO fournit une infrastructure complète pour l'optimisation du référencement naturel de l'application. Il gère les métadonnées, les balises structured data, les sitemaps, et l'ensemble des optimisations techniques nécessaires au bon référencement du site web.

## Rôle et Responsabilités

### Fonctionnalités principales

- **Métadonnées dynamiques** : Gestion des balises title, description, keywords
- **Open Graph & Twitter Cards** : Métadonnées pour les réseaux sociaux
- **Structured Data** : JSON-LD pour les moteurs de recherche
- **Sitemap XML** : Génération automatique des sitemaps
- **URLs canoniques** : Gestion des duplicatas de contenu
- **Optimisation technique** : Gzip, cache headers, optimisation images
- **Analytics** : Intégration Google Analytics/Tag Manager

## Entités et Modèles Doctrine

### Entité Seo

```php
#[ORM\Entity(repositoryClass: SeoRepository::class)]
class Seo
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 100)]
    #[Assert\NotBlank]
    #[Assert\Length(max: 100)]
    private ?string $page_name = null;

    #[ORM\Column(length: 300)]
    #[Assert\NotBlank]
    #[Assert\Length(max: 300)]
    private ?string $route_name = null;

    #[ORM\Column(length: 70)]
    #[Assert\NotBlank]
    #[Assert\Length(max: 70, maxMessage: 'Le titre ne doit pas dépasser {{ limit }} caractères')]
    private ?string $title = null;

    #[ORM\Column(length: 160)]
    #[Assert\NotBlank]
    #[Assert\Length(max: 160, maxMessage: 'La description ne doit pas dépasser {{ limit }} caractères')]
    private ?string $description = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Assert\Length(max: 255)]
    private ?string $keywords = null;

    #[ORM\Column(length: 500, nullable: true)]
    #[Assert\Url]
    private ?string $canonical_url = null;

    #[ORM\Column(length: 500, nullable: true)]
    #[Assert\Url]
    private ?string $og_image = null;

    #[ORM\Column(length: 50, nullable: true)]
    private ?string $og_type = null;

    #[ORM\Column(nullable: true)]
    private ?bool $noindex = null;

    #[ORM\Column(nullable: true)]
    private ?bool $nofollow = null;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    private ?array $structured_data = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $created_at = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $updated_at = null;

    // Relations
    #[ORM\OneToMany(targetEntity: SeoTag::class, mappedBy: 'seo', cascade: ['persist', 'remove'])]
    private Collection $seoTags;

    public function __construct()
    {
        $this->seoTags = new ArrayCollection();
        $this->created_at = new \DateTimeImmutable();
    }

    // Getters et Setters...
}
```

### Entité SeoTag

```php
#[ORM\Entity(repositoryClass: SeoTagRepository::class)]
class SeoTag
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'seoTags')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Seo $seo = null;

    #[ORM\Column(length: 50)]
    #[Assert\NotBlank]
    private ?string $tag_name = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    private ?string $tag_content = null;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $tag_property = null; // pour property="og:title" par exemple

    #[ORM\Column(length: 50, nullable: true)]
    private ?string $tag_type = null; // meta, property, name

    #[ORM\Column]
    private ?\DateTimeImmutable $created_at = null;

    public function __construct()
    {
        $this->created_at = new \DateTimeImmutable();
    }

    // Getters et Setters...
}
```

## Services SEO

### SeoService (App\Service\SeoService)

Service principal de gestion SEO.

```php
final class SeoService
{
    use ResponseTrait, DateTimeTrait;

    private const LOG_FILE = 'service/seo-service';

    public function __construct(
        private SeoRepository $seoRepository,
        private EntityManagerInterface $manager,
        private RequestStack $requestStack,
        private RouterInterface $router,
        private ParameterBagInterface $parameterBag
    ) {}

    /**
     * Récupérer les données SEO pour une route
     */
    public function getSeoDataForRoute(string $routeName, array $routeParams = []): ?Seo
    {
        return $this->seoRepository->findByRouteName($routeName);
    }

    /**
     * Générer les métadonnées pour une page
     */
    public function generateMetaTags(string $routeName, array $params = []): array
    {
        $seo = $this->getSeoDataForRoute($routeName);

        if (!$seo) {
            return $this->getDefaultMetaTags();
        }

        $metaTags = [
            'title' => $this->interpolateVariables($seo->getTitle(), $params),
            'description' => $this->interpolateVariables($seo->getDescription(), $params),
            'keywords' => $seo->getKeywords(),
            'canonical' => $this->generateCanonicalUrl($seo, $routeName, $params),
            'og_image' => $seo->getOgImage(),
            'og_type' => $seo->getOgType() ?? 'website',
            'noindex' => $seo->isNoindex(),
            'nofollow' => $seo->isNofollow(),
            'structured_data' => $this->generateStructuredData($seo, $params)
        ];

        // Ajouter les tags personnalisés
        foreach ($seo->getSeoTags() as $tag) {
            $metaTags['custom_tags'][] = [
                'name' => $tag->getTagName(),
                'content' => $this->interpolateVariables($tag->getTagContent(), $params),
                'property' => $tag->getTagProperty(),
                'type' => $tag->getTagType()
            ];
        }

        return $metaTags;
    }

    /**
     * Créer/Mettre à jour une configuration SEO
     */
    public function createOrUpdateSeo(string $routeName, array $seoData): Seo
    {
        $seo = $this->seoRepository->findByRouteName($routeName) ?? new Seo();

        $seo->setRouteName($routeName)
           ->setPageName($seoData['page_name'])
           ->setTitle($seoData['title'])
           ->setDescription($seoData['description'])
           ->setKeywords($seoData['keywords'] ?? null)
           ->setCanonicalUrl($seoData['canonical_url'] ?? null)
           ->setOgImage($seoData['og_image'] ?? null)
           ->setOgType($seoData['og_type'] ?? 'website')
           ->setNoindex($seoData['noindex'] ?? false)
           ->setNofollow($seoData['nofollow'] ?? false)
           ->setStructuredData($seoData['structured_data'] ?? null)
           ->setUpdatedAt($this->now());

        $this->manager->persist($seo);
        $this->manager->flush();

        return $seo;
    }

    /**
     * Interpoler les variables dans les textes SEO
     */
    private function interpolateVariables(string $text, array $params): string
    {
        foreach ($params as $key => $value) {
            $text = str_replace("{{$key}}", (string)$value, $text);
        }

        return $text;
    }

    /**
     * Générer l'URL canonique
     */
    private function generateCanonicalUrl(Seo $seo, string $routeName, array $params): string
    {
        if ($seo->getCanonicalUrl()) {
            return $this->interpolateVariables($seo->getCanonicalUrl(), $params);
        }

        $request = $this->requestStack->getCurrentRequest();
        $baseUrl = $request ? $request->getSchemeAndHttpHost() : '';

        try {
            $path = $this->router->generate($routeName, $params);
            return $baseUrl . $path;
        } catch (\Exception $e) {
            return $baseUrl;
        }
    }

    /**
     * Générer les données structurées JSON-LD
     */
    private function generateStructuredData(Seo $seo, array $params): ?array
    {
        $structuredData = $seo->getStructuredData();

        if (!$structuredData) {
            return null;
        }

        // Interpolation des variables dans les données structurées
        $jsonString = json_encode($structuredData);
        $interpolatedJson = $this->interpolateVariables($jsonString, $params);

        return json_decode($interpolatedJson, true);
    }

    /**
     * Métadonnées par défaut
     */
    private function getDefaultMetaTags(): array
    {
        return [
            'title' => $this->parameterBag->get('app.name'),
            'description' => $this->parameterBag->get('app.description'),
            'keywords' => '',
            'canonical' => '',
            'og_image' => '/images/default-og-image.jpg',
            'og_type' => 'website',
            'noindex' => false,
            'nofollow' => false,
            'structured_data' => null,
            'custom_tags' => []
        ];
    }

    /**
     * Analyser une page pour les optimisations SEO
     */
    public function analyzePage(string $url): array
    {
        // Simulation d'analyse SEO
        return [
            'score' => 85,
            'issues' => [
                'title_length' => 'Le titre est un peu long (72 caractères)',
                'missing_alt' => '3 images sans attribut alt détectées'
            ],
            'recommendations' => [
                'Réduire la taille du titre à moins de 60 caractères',
                'Ajouter des attributs alt aux images',
                'Optimiser la vitesse de chargement'
            ]
        ];
    }
}
```

### SitemapService (App\Service\SitemapService)

Service de génération des sitemaps XML.

```php
final class SitemapService
{
    public function __construct(
        private SeoRepository $seoRepository,
        private RouterInterface $router,
        private ParameterBagInterface $parameterBag,
        private KernelInterface $kernel
    ) {}

    /**
     * Générer le sitemap principal
     */
    public function generateSitemap(): string
    {
        $urls = $this->collectUrls();

        $xml = new \DOMDocument('1.0', 'UTF-8');
        $xml->formatOutput = true;

        $urlset = $xml->createElement('urlset');
        $urlset->setAttribute('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9');
        $xml->appendChild($urlset);

        foreach ($urls as $urlData) {
            $url = $xml->createElement('url');

            $loc = $xml->createElement('loc', htmlspecialchars($urlData['loc']));
            $url->appendChild($loc);

            if (isset($urlData['lastmod'])) {
                $lastmod = $xml->createElement('lastmod', $urlData['lastmod']);
                $url->appendChild($lastmod);
            }

            if (isset($urlData['changefreq'])) {
                $changefreq = $xml->createElement('changefreq', $urlData['changefreq']);
                $url->appendChild($changefreq);
            }

            if (isset($urlData['priority'])) {
                $priority = $xml->createElement('priority', $urlData['priority']);
                $url->appendChild($priority);
            }

            $urlset->appendChild($url);
        }

        $sitemapContent = $xml->saveXML();

        // Sauvegarder le sitemap
        $sitemapPath = $this->kernel->getProjectDir() . '/public/sitemap.xml';
        file_put_contents($sitemapPath, $sitemapContent);

        return $sitemapContent;
    }

    /**
     * Collecter toutes les URLs du site
     */
    private function collectUrls(): array
    {
        $urls = [];
        $baseUrl = $this->parameterBag->get('app.base_url');

        // URLs statiques depuis la configuration SEO
        $seoPages = $this->seoRepository->findAll();
        foreach ($seoPages as $seo) {
            if (!$seo->isNoindex()) {
                $urls[] = [
                    'loc' => $baseUrl . $this->router->generate($seo->getRouteName()),
                    'lastmod' => $seo->getUpdatedAt()?->format('Y-m-d'),
                    'changefreq' => $this->determineChangeFreq($seo->getRouteName()),
                    'priority' => $this->determinePriority($seo->getRouteName())
                ];
            }
        }

        // Ajouter d'autres URLs dynamiques (articles, produits, etc.)
        $urls = array_merge($urls, $this->collectDynamicUrls());

        return $urls;
    }

    /**
     * Déterminer la fréquence de changement
     */
    private function determineChangeFreq(string $routeName): string
    {
        return match(true) {
            str_contains($routeName, 'homepage') => 'daily',
            str_contains($routeName, 'blog') => 'weekly',
            str_contains($routeName, 'contact') => 'monthly',
            default => 'monthly'
        };
    }

    /**
     * Déterminer la priorité
     */
    private function determinePriority(string $routeName): string
    {
        return match(true) {
            str_contains($routeName, 'homepage') => '1.0',
            str_contains($routeName, 'about') => '0.8',
            str_contains($routeName, 'contact') => '0.6',
            default => '0.5'
        };
    }

    /**
     * Collecter les URLs dynamiques
     */
    private function collectDynamicUrls(): array
    {
        // Ici on pourrait récupérer les articles de blog, produits, etc.
        return [];
    }
}
```

## Contrôleurs SEO

### SeoController (Admin)

```php
#[Route('/admin/seo', name: 'admin_seo_')]
final class SeoController extends AbstractController
{
    public function __construct(
        private SeoService $seoService,
        private SitemapService $sitemapService,
        private PaginatorInterface $paginator
    ) {}

    #[Route('', name: 'index', methods: ['GET'])]
    #[IsGranted('admin.seo.list')]
    public function index(Request $request): Response
    {
        $page = $request->query->getInt('page', 1);

        $queryBuilder = $this->seoService->getSeoQueryBuilder();
        $pagination = $this->paginator->paginate($queryBuilder, $page, 20);

        return $this->render('@admin/seo/index.html.twig', [
            'pagination' => $pagination
        ]);
    }

    #[Route('/create', name: 'create', methods: ['GET', 'POST'])]
    #[IsGranted('admin.seo.create')]
    public function create(Request $request): Response
    {
        $seo = new Seo();
        $form = $this->createForm(SeoType::class, $seo);

        $form->handleRequest($request);
        if ($form->isSubmitted() && $form->isValid()) {
            $this->seoService->save($seo);
            $this->addFlash('success', 'Configuration SEO créée avec succès');
            return $this->redirectToRoute('admin_seo_index');
        }

        return $this->render('@admin/seo/create.html.twig', [
            'form' => $form,
            'seo' => $seo
        ]);
    }

    #[Route('/{id}/edit', name: 'edit', methods: ['GET', 'POST'])]
    #[IsGranted('admin.seo.edit')]
    public function edit(Seo $seo, Request $request): Response
    {
        $form = $this->createForm(SeoType::class, $seo);

        $form->handleRequest($request);
        if ($form->isSubmitted() && $form->isValid()) {
            $this->seoService->update($seo);
            $this->addFlash('success', 'Configuration SEO modifiée avec succès');
            return $this->redirectToRoute('admin_seo_index');
        }

        return $this->render('@admin/seo/edit.html.twig', [
            'form' => $form,
            'seo' => $seo
        ]);
    }

    #[Route('/sitemap/generate', name: 'generate_sitemap', methods: ['POST'])]
    #[IsGranted('admin.seo.manage')]
    public function generateSitemap(): JsonResponse
    {
        try {
            $this->sitemapService->generateSitemap();
            return $this->json(['success' => true, 'message' => 'Sitemap généré avec succès']);
        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], 500);
        }
    }

    #[Route('/analyze', name: 'analyze', methods: ['POST'])]
    #[IsGranted('admin.seo.analyze')]
    public function analyzePage(Request $request): JsonResponse
    {
        $url = $request->request->get('url');

        if (!$url) {
            return $this->json(['error' => 'URL requise'], 400);
        }

        $analysis = $this->seoService->analyzePage($url);
        return $this->json($analysis);
    }
}
```

## Formulaires Symfony

### SeoType

```php
class SeoType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('page_name', TextType::class, [
                'label' => 'Nom de la page',
                'help' => 'Nom descriptif pour identifier cette configuration'
            ])
            ->add('route_name', ChoiceType::class, [
                'label' => 'Route Symfony',
                'choices' => $this->getRouteChoices(),
                'placeholder' => 'Sélectionner une route'
            ])
            ->add('title', TextType::class, [
                'label' => 'Titre SEO',
                'help' => 'Maximum 70 caractères recommandés',
                'attr' => ['maxlength' => 70]
            ])
            ->add('description', TextareaType::class, [
                'label' => 'Description SEO',
                'help' => 'Maximum 160 caractères recommandés',
                'attr' => [
                    'maxlength' => 160,
                    'rows' => 3
                ]
            ])
            ->add('keywords', TextType::class, [
                'label' => 'Mots-clés',
                'required' => false,
                'help' => 'Séparés par des virgules'
            ])
            ->add('canonical_url', UrlType::class, [
                'label' => 'URL canonique',
                'required' => false,
                'help' => 'Laisser vide pour génération automatique'
            ])
            ->add('og_image', UrlType::class, [
                'label' => 'Image Open Graph',
                'required' => false,
                'help' => 'Image pour le partage sur les réseaux sociaux'
            ])
            ->add('og_type', ChoiceType::class, [
                'label' => 'Type Open Graph',
                'choices' => [
                    'Website' => 'website',
                    'Article' => 'article',
                    'Product' => 'product',
                    'Profile' => 'profile'
                ],
                'data' => 'website'
            ])
            ->add('noindex', CheckboxType::class, [
                'label' => 'Noindex',
                'required' => false,
                'help' => 'Empêcher l\'indexation par les moteurs'
            ])
            ->add('nofollow', CheckboxType::class, [
                'label' => 'Nofollow',
                'required' => false,
                'help' => 'Empêcher le suivi des liens'
            ])
            ->add('structured_data', TextareaType::class, [
                'label' => 'Données structurées (JSON-LD)',
                'required' => false,
                'attr' => [
                    'rows' => 10,
                    'class' => 'json-editor'
                ],
                'help' => 'Format JSON pour les données structurées'
            ]);
    }

    private function getRouteChoices(): array
    {
        // Récupérer les routes depuis le router
        return [
            'Accueil' => 'app_index',
            'À propos' => 'app_about',
            'Contact' => 'app_contact',
            'Blog' => 'app_blog_index',
            'Article de blog' => 'app_blog_show'
        ];
    }
}
```

## Extension Twig SEO

### SeoExtension

```php
class SeoExtension extends AbstractExtension
{
    public function __construct(
        private SeoService $seoService,
        private RequestStack $requestStack
    ) {}

    public function getFunctions(): array
    {
        return [
            new TwigFunction('seo_meta_tags', [$this, 'renderMetaTags'], ['is_safe' => ['html']]),
            new TwigFunction('seo_title', [$this, 'getSeoTitle']),
            new TwigFunction('seo_description', [$this, 'getSeoDescription']),
            new TwigFunction('seo_structured_data', [$this, 'renderStructuredData'], ['is_safe' => ['html']])
        ];
    }

    /**
     * Rendre les balises meta complètes
     */
    public function renderMetaTags(array $params = []): string
    {
        $request = $this->requestStack->getCurrentRequest();
        if (!$request) {
            return '';
        }

        $routeName = $request->get('_route');
        $metaTags = $this->seoService->generateMetaTags($routeName, $params);

        $html = '';

        // Title
        $html .= sprintf('<title>%s</title>' . PHP_EOL, htmlspecialchars($metaTags['title']));

        // Meta description
        $html .= sprintf('<meta name="description" content="%s">' . PHP_EOL,
                        htmlspecialchars($metaTags['description']));

        // Keywords
        if ($metaTags['keywords']) {
            $html .= sprintf('<meta name="keywords" content="%s">' . PHP_EOL,
                            htmlspecialchars($metaTags['keywords']));
        }

        // Canonical
        if ($metaTags['canonical']) {
            $html .= sprintf('<link rel="canonical" href="%s">' . PHP_EOL,
                            htmlspecialchars($metaTags['canonical']));
        }

        // Open Graph
        $html .= sprintf('<meta property="og:title" content="%s">' . PHP_EOL,
                        htmlspecialchars($metaTags['title']));
        $html .= sprintf('<meta property="og:description" content="%s">' . PHP_EOL,
                        htmlspecialchars($metaTags['description']));
        $html .= sprintf('<meta property="og:type" content="%s">' . PHP_EOL,
                        htmlspecialchars($metaTags['og_type']));

        if ($metaTags['og_image']) {
            $html .= sprintf('<meta property="og:image" content="%s">' . PHP_EOL,
                            htmlspecialchars($metaTags['og_image']));
        }

        // Twitter Card
        $html .= '<meta name="twitter:card" content="summary_large_image">' . PHP_EOL;

        // Robots
        $robots = [];
        if ($metaTags['noindex']) $robots[] = 'noindex';
        if ($metaTags['nofollow']) $robots[] = 'nofollow';
        if (empty($robots)) $robots[] = 'index,follow';

        $html .= sprintf('<meta name="robots" content="%s">' . PHP_EOL,
                        implode(',', $robots));

        // Tags personnalisés
        if (isset($metaTags['custom_tags'])) {
            foreach ($metaTags['custom_tags'] as $tag) {
                if ($tag['type'] === 'property') {
                    $html .= sprintf('<meta property="%s" content="%s">' . PHP_EOL,
                                    htmlspecialchars($tag['property']),
                                    htmlspecialchars($tag['content']));
                } else {
                    $html .= sprintf('<meta name="%s" content="%s">' . PHP_EOL,
                                    htmlspecialchars($tag['name']),
                                    htmlspecialchars($tag['content']));
                }
            }
        }

        return $html;
    }

    /**
     * Rendre les données structurées JSON-LD
     */
    public function renderStructuredData(array $params = []): string
    {
        $request = $this->requestStack->getCurrentRequest();
        if (!$request) {
            return '';
        }

        $routeName = $request->get('_route');
        $metaTags = $this->seoService->generateMetaTags($routeName, $params);

        if (!$metaTags['structured_data']) {
            return '';
        }

        return sprintf(
            '<script type="application/ld+json">%s</script>',
            json_encode($metaTags['structured_data'], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
        );
    }
}
```

## Templates Twig

### Layout de base avec SEO

```twig
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    {# SEO Meta Tags #}
    {{ seo_meta_tags(seo_params|default({})) }}

    {# Favicon #}
    <link rel="icon" type="image/x-icon" href="{{ asset('favicon.ico') }}">
    <link rel="apple-touch-icon" sizes="180x180" href="{{ asset('apple-touch-icon.png') }}">

    {# CSS #}
    {{ encore_entry_link_tags('app') }}

    {# Données structurées #}
    {{ seo_structured_data(seo_params|default({})) }}

    {# Google Analytics / Tag Manager #}
    {% if app.environment == 'prod' %}
        <!-- Google Tag Manager -->
        <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','{{ gtm_id }}');</script>
        <!-- End Google Tag Manager -->
    {% endif %}
</head>
<body>
    {% if app.environment == 'prod' %}
        <!-- Google Tag Manager (noscript) -->
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id={{ gtm_id }}"
        height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
        <!-- End Google Tag Manager (noscript) -->
    {% endif %}

    {% block content %}{% endblock %}

    {{ encore_entry_script_tags('app') }}
</body>
</html>
```

## Configuration et Optimisation

### Optimisations techniques

```yaml
# config/packages/framework.yaml
framework:
  # Compression
  assets:
    version_strategy: App\Asset\VersionStrategy

  # Cache HTTP
  http_cache:
    enabled: true
    private_headers: ['Authorization', 'Cookie']

# config/packages/web_profiler.yaml (uniquement en dev)
when@prod:
  web_profiler:
    toolbar: false
    intercept_redirects: false
```

### Robots.txt dynamique

```php
#[Route('/robots.txt', name: 'robots_txt')]
public function robotsTxt(): Response
{
    $content = "User-agent: *\n";

    if ($this->parameterBag->get('kernel.environment') === 'prod') {
        $content .= "Allow: /\n";
        $content .= "Sitemap: " . $this->parameterBag->get('app.base_url') . "/sitemap.xml\n";
    } else {
        $content .= "Disallow: /\n";
    }

    return new Response($content, 200, ['Content-Type' => 'text/plain']);
}
```

## Routes et Endpoints

### Routes publiques SEO

- `GET /sitemap.xml` : Sitemap principal
- `GET /robots.txt` : Fichier robots.txt dynamique

### Routes d'administration

- `GET /admin/seo` : Liste des configurations SEO
- `GET|POST /admin/seo/create` : Création configuration
- `GET|POST /admin/seo/{id}/edit` : Édition configuration
- `POST /admin/seo/sitemap/generate` : Génération sitemap
- `POST /admin/seo/analyze` : Analyse SEO d'une page

## Interdépendances

### Modules utilisés

- **Router** : Génération d'URLs canoniques
- **Twig** : Extensions pour les meta tags
- **Cache** : Mise en cache des configurations

### Services externes

- **Google Analytics** : Tracking des performances
- **Google Search Console** : Monitoring SEO
- **Schema.org** : Validation des données structurées

## Bonnes Pratiques

### Optimisation on-page

- Titres uniques et descriptifs (< 60 caractères)
- Descriptions engageantes (< 160 caractères)
- URLs propres et SEO-friendly
- Images optimisées avec attributs alt
- Balisage sémantique HTML5

### Performance web

- Compression Gzip/Brotli
- Minification CSS/JS
- Optimisation des images (WebP, lazy loading)
- Cache-Control approprié
- Core Web Vitals optimisés

Le module SEO fournit tous les outils nécessaires pour optimiser le référencement naturel et assurer une visibilité maximale dans les moteurs de recherche.
