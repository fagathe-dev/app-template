# Retro-ingénierie et Génération Initiale de la Documentation

## Contexte

Je suis un développeur travaillant sur une application web complexe basée sur **Symfony pour le backend (PHP)** et utilisant **TypeScript, SCSS/CSS pour le frontend**, avec **Webpack Encore** pour la compilation des assets. L'application utilise également des **scripts de pré-commit, de linting et de test** pour assurer la qualité du code. Je souhaite générer une documentation complète et compréhensible du code source existant de mon application. La documentation doit être structurée pour être facilement navigable et utile pour de futurs développeurs ou pour la maintenance.

## Objectif

Générer une documentation exhaustive du code de l'application dans un nouveau répertoire `docs/`.

## Instructions

1.  **Analyse du code :**
    - Examine tout le code source fourni dans le répertoire de l'application.
    - Identifie les langages de programmation utilisés : **PHP (Symfony), TypeScript, JavaScript, SCSS, CSS, HTML (Twig)**.
    - Comprend l'architecture générale de l'application Symfony (MVC, services, entités Doctrine, formulaires, sécurité, commandes console).
    - Détecte les principaux bundles, services, contrôleurs, entités, repositories, formulaires, événements, et leurs interconnexions.
    - Comprend l'intégration frontend via Webpack Encore, les points d'entrée (entrypoints), les dépendances JavaScript/TypeScript, et les styles SCSS.
    - Identifie les API internes (endpoints Symfony) et les éventuelles API externes utilisées.
    - Comprend la logique métier principale derrière chaque fonctionnalité.
    - **Identifie les configurations des scripts de qualité de code :**
      - **Pré-commit hooks** (souvent via Husky et lint-staged).
      - **Scripts de linting** (ESLint pour JS/TS, Stylelint pour SCSS/CSS, PHPStan/PHP-CS-Fixer pour PHP).
      - **Scripts de test** (npm test, phpunit, etc.).
      - **Scripts de build** (npm run build, npm run dev).

2.  **Structure de la documentation :**
    Le répertoire `docs/` doit contenir les sous-répertoires et fichiers suivants :
    - `docs/README.md` : Vue d'ensemble générale de l'application.
    - `docs/installation_and_setup.md` : Instructions pour l'installation, la configuration de l'environnement de développement, et les commandes de démarrage.
    - `docs/commands.md` : Liste des commandes clés de l'application (Symfony Console, Webpack Encore, scripts npm).
    - `docs/development_workflow.md` : **Nouveau fichier pour les scripts de qualité de code.**
    - `docs/architecture/`
      - `docs/architecture/overview.md` : Diagramme de haut niveau et description de l'architecture globale (backend Symfony + frontend Webpack Encore).
      - `docs/architecture/backend_structure.md` : Organisation des répertoires Symfony (src/, config/, templates/, etc.), rôle des bundles.
      - `docs/architecture/frontend_structure.md` : Organisation du code frontend (assets/, `webpack.config.js`), flux de compilation.
      - `docs/architecture/data_flow.md` : Explication des flux de données clés entre le frontend, le backend et la base de données.
      - `docs/architecture/technologies.md` : Liste et rôle des technologies utilisées (Symfony, Doctrine, Twig, Webpack Encore, TypeScript, SCSS, etc.).
    - `docs/modules/` : Un sous-répertoire par module ou grande fonctionnalité (ex: `docs/modules/UserManagement.md`, `docs/modules/ProductCatalog.md`).
      - Chaque fichier de module doit décrire :
        - Son rôle et ses responsabilités.
        - Les entités Doctrine/modèles associés.
        - Les contrôleurs, services, et repositories principaux.
        - Les routes/endpoints pertinents (avec méthodes HTTP).
        - Les formulaires Symfony utilisés.
        - Les templates Twig associés.
        - Les interdépendances avec d'autres modules.
        - Les composants frontend (TypeScript/SCSS) liés à ce module.
    - `docs/api/` : Documentation des API.
      - `docs/api/internal_rest.md` : Documentation des endpoints REST internes de Symfony (avec exemples de requêtes/réponses si possible).
      - `docs/api/external_integrations.md` : Documentation des intégrations avec des APIs tierces (si applicable).
    - `docs/database/`
      - `docs/database/schema.md` : Description des principales entités Doctrine, de leurs relations et des champs clés.
      - `docs/database/migrations.md` : Vue d'ensemble des conventions de migration Doctrine.
    - `docs/security/`
      - `docs/security/authentication_authorization.md` : Mécanismes d'authentification et d'autorisation Symfony.
      - `docs/security/best_practices.md` : Bonnes pratiques de sécurité implémentées.
    - `docs/frontend/`
      - `docs/frontend/overview.md` : Vue d'ensemble de l'intégration frontend avec Webpack Encore (comment ça fonctionne, pourquoi).
      - `docs/frontend/typescript_js.md` : Conventions de code TypeScript/JavaScript, organisation des fichiers, utilisation de librairies spécifiques.
      - `docs/frontend/scss_css.md` : Organisation des fichiers SCSS, conventions de nommage, utilisation de frameworks CSS (ex: Bootstrap), compilation.
      - `docs/frontend/components.md` : Description des principaux composants JavaScript/TypeScript réutilisables (si applicable, ex: Stimulus controllers).
    - `docs/testing/` (si des tests sont détectés - PHPUnit, Jest/Vitest, Cypress)
      - `docs/testing/overview.md` : Stratégie de test globale (unitaires, fonctionnels, e2e), outils utilisés.
      - `docs/testing/backend_tests.md` : Comment écrire et exécuter des tests PHPUnit.
      - `docs/testing/frontend_tests.md` : Comment écrire et exécuter des tests JavaScript/TypeScript (Jest/Vitest, Cypress).

3.  **Contenu de la documentation :**
    - Utilise un langage clair, concis et professionnel.
    - Met en évidence les points importants avec des listes, des blocs de code (avec syntaxe `php`, `typescript`, `scss`, `bash`), et des titres/sous-titres pertinents.
    - Chaque section doit commencer par une brève introduction de son contenu.
    - Pour les fonctions/méthodes/classes/services/contrôleurs critiques, inclut :
      - Leur rôle.
      - Leurs paramètres.
      - Ce qu'elles retournent.
      - Les effets de bord.
      - Les exceptions possibles.
    - Évite la duplication d'informations.
    - **Inclus des exemples de commandes réelles et pertinentes pour le développement et le déploiement (build, cache, migrations, tests, linting, pre-commit).**
    - Le nouveau fichier `docs/development_workflow.md` doit inclure des sections sur :
      - Les commandes de build (développement et production).
      - Les commandes de linting (PHP, TS/JS, SCSS) et comment les exécuter.
      - Les hooks de pré-commit et ce qu'ils vérifient.
      - Les commandes de formatage de code.

4.  **Format de sortie :**
    - Fournit le contenu de chaque fichier Markdown demandé.
    - Structure la réponse de manière à ce que je puisse facilement copier-coller chaque section dans le fichier Markdown correspondant.

---

# Prompt pour la Mise à Jour de la Documentation (Exécution Directe)

## Contexte

Le code source de l'application Symfony/TypeScript/SCSS a subi des modifications. Je souhaite mettre à jour la documentation existante pour refléter ces changements.

## Objectif

Fournir le contenu mis à jour pour les sections affectées des fichiers de documentation existants dans le répertoire `docs/`, ou le contenu complet de nouveaux fichiers Markdown si des ajouts majeurs sont nécessaires.

## Instructions

1.  **Analyse des changements :**
    - Tu recevras les **diffs** ou les **fichiers modifiés** de l'application.
    - Identifie précisément les fichiers (PHP, Twig, TS, JS, SCSS), fonctions, classes, routes, entités, services, commandes, styles, scripts de build/lint/test, etc., qui ont été ajoutés, modifiés ou supprimés.
    - Comprend l'impact de ces changements sur l'architecture, la logique métier, les interfaces, les interactions entre les modules backend et frontend, les commandes de build/déploiement, et le workflow de développement (linting, tests, pre-commit).

2.  **Mise à jour de la documentation :**
    - Identifie les fichiers Markdown pertinents dans le répertoire `docs/` qui nécessitent une mise à jour.
    - Pour chaque fichier affecté, **génère le contenu complet de la section ou du paragraphe qui a été modifié ou ajouté.** Ne reproduis pas tout le fichier, mais seulement les parties pertinentes.
    - Si une section existante est modifiée, commence par le titre de la section existante, puis le contenu mis à jour.
    - Si une nouvelle section est ajoutée à un fichier existant, indique clairement où elle devrait être insérée (par exemple, "À ajouter après la section X").
    - Si un nouvel élément (nouvelle entité, nouveau module, nouvelle commande, nouveau script de qualité, etc.) justifie la création d'un **nouveau fichier Markdown**, fournis le **contenu complet** de ce nouveau fichier.
    - Assure-toi que les mises à jour sont concises, précises et reflètent fidèlement les changements du code.
    - Maintiens la cohérence du style et du formatage avec la documentation existante.
    - Si un élément a été supprimé ou déprécié, indique la section concernée et la modification à effectuer (par exemple, "Supprimer la section suivante : ...").

3.  **Format de sortie :**
    - Pour chaque fichier à mettre à jour ou à créer, indique le **chemin complet du fichier** (ex: `docs/modules/UserManagement.md`, `docs/commands.md`, `docs/development_workflow.md`).
    - Ensuite, présente le **contenu Markdown exact à copier/coller** dans ce fichier pour la mise à jour (soit une section, soit un fichier complet pour les ajouts).
    - Utilise des titres clairs pour chaque fichier concerné.

    ````markdown
    ### Fichier à mettre à jour : `docs/modules/ProductCatalog.md`

    #### Gestion des prix

    Le calcul des prix prend désormais en compte la TVA en fonction du pays de l'utilisateur. Ce calcul est délégué au `VatCalculatorService` qui interagit avec une API externe pour obtenir les taux de TVA.

    ---

    ### Fichier à mettre à jour : `docs/commands.md`

    #### Commandes de l'application

    ##### `app:sync-products-from-erp`

    Synchronise les données des produits avec le système ERP externe. Cette commande peut être exécutée en mode complet (`--full`) pour une resynchronisation totale, ou en mode incrémental par défaut.

    **Usage :**

    ```bash
    php bin/console app:sync-products-from-erp
    php bin/console app:sync-products-from-erp --full
    ```
    ````

    ***

    ### Nouveau fichier : `docs/development_workflow.md`

    # Workflow de Développement et Qualité du Code

    Ce document décrit les outils et les pratiques utilisées pour maintenir la qualité du code et assurer un workflow de développement cohérent.

    ## Commandes de Build des Assets Frontend

    L'application utilise [Webpack Encore](https://symfony.com/doc/current/frontend.html) pour compiler les assets JavaScript, TypeScript et SCSS.
    - **Mode développement (avec auto-rechargement) :**
      Lance le serveur de développement Webpack Encore, qui recompilera les assets à chaque modification.
      ```bash
      npm run dev
      ```
    - **Build pour la production :**
      Compile et minifie les assets pour le déploiement en production.
      ```bash
      npm run build
      ```

    ## Linting et Formatage du Code

    Le linting et le formatage sont appliqués pour maintenir une base de code propre et cohérente.

    ### JavaScript/TypeScript
    - **Outil :** [ESLint](https://eslint.org/)
    - **Configuration :** `.eslintrc.js`
    - **Exécuter manuellement :**
      ```bash
      npm run lint:js
      ```
    - **Corriger automatiquement (si possible) :**
      ```bash
      npm run lint:js -- --fix
      ```

    ### SCSS/CSS
    - **Outil :** [Stylelint](https://stylelint.io/)
    - **Configuration :** `.stylelintrc.json`
    - **Exécuter manuellement :**
      ```bash
      npm run lint:css
      ```
    - **Corriger automatiquement (si possible) :**
      ```bash
      npm run lint:css -- --fix
      ```

    ### PHP
    - **Outil(s) :** [PHPStan](https://phpstan.org/) (analyse statique), [PHP-CS-Fixer](https://cs.symfony.com/) (standard de code).
    - **Configuration :** `phpstan.neon`, `.php-cs-fixer.dist.php`
    - **Exécuter PHPStan :**
      ```bash
      composer analyse
      ```
    - **Exécuter PHP-CS-Fixer (vérifier) :**
      ```bash
      composer cs-check
      ```
    - **Exécuter PHP-CS-Fixer (corriger) :**
      ```bash
      composer cs-fix
      ```

    ## Hooks de Pré-commit (Husky & lint-staged)

    L'application utilise [Husky](https://typicode.github.io/husky/) pour gérer les hooks Git et [lint-staged](https://github.com/okonet/lint-staged) pour exécuter des commandes sur les fichiers mis en scène (`git add`) avant chaque commit.
    - **`pre-commit` hook :** Avant chaque commit, les fichiers modifiés sont automatiquement lintés et formatés.
      - Les fichiers `.js`, `.ts` sont traités par ESLint.
      - Les fichiers `.scss`, `.css` sont traités par Stylelint.
      - Les fichiers `.php` sont traités par PHP-CS-Fixer.
    - **Objectif :** Assurer que seul du code qui respecte les standards est commité dans le dépôt.
    - **Configuration :** Voir les fichiers `.husky/pre-commit` et `package.json` (section `lint-staged`).

    ***

    ### Nouveau fichier proposé : `docs/modules/PaymentGatewayIntegration.md`

    (Contenu complet du nouveau fichier Markdown pour ce nouveau module/intégration)

    ***

    ```

    ```
