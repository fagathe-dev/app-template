# Structure Frontend

## Vue d'ensemble

Le frontend de l'application utilise **TypeScript** et **SCSS** compilés via des scripts personnalisés basés sur **esbuild** et **sass**, offrant une alternative moderne et performante à Webpack Encore traditionnel.

## Organisation des Assets

### Structure des Sources

```
public/
├─ ts/              # Sources TypeScript
│  ├─ utils/        # Utilitaires généraux
│  ├─ admin/        # Scripts d'administration
│  └─ test.ts       # Tests et exemples
├─ scss/            # Sources SCSS
│  ├─ config/       # Configuration et thèmes
│  ├─ icons.scss    # Icônes
│  └─ custom/       # Styles personnalisés
└─ assets/          # Assets statiques externes
   ├─ libs/         # Librairies tierces
   ├─ images/       # Images
   ├─ fonts/        # Polices
   └─ json/         # Données JSON
```

### Structure Compilée

```
public/
├─ js/              # JavaScript compilé
│  ├─ utils/        # Utilitaires compilés
│  ├─ admin/        # Scripts admin compilés
│  └─ test.js       # Tests compilés
├─ js-mini/         # JavaScript minifié
├─ css/             # CSS compilé
├─ css-mini/        # CSS minifié
└─ assets/          # Assets optimisés
```

## Configuration TypeScript

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "strictNullChecks": true,
    "noImplicitAny": false,
    "strictFunctionTypes": false,
    "strictPropertyInitialization": true,
    "outDir": "public/js",
    "moduleResolution": "node",
    "sourceMap": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["assets/ts", "public/ts"],
  "exclude": ["node_modules"]
}
```

### Fonctionnalités TypeScript Utilisées

- **Modules ES natifs** (import/export)
- **Types stricts** avec vérifications
- **Async/await** pour les requêtes
- **Classes et interfaces** pour la structure
- **Décorateurs** (si nécessaire)

## Système de Compilation

### Scripts de Build Personnalisés

#### build-js.js (esbuild)

```javascript
const esbuild = require('esbuild');

// Configuration esbuild pour TypeScript
const buildOptions = {
  entryPoints: getAllTsFiles('public/ts'),
  outdir: 'public/js-mini',
  bundle: false,
  format: 'esm',
  target: 'es2020',
  minify: true,
  sourcemap: false,
};

esbuild.build(buildOptions);
```

#### build-css.js (sass)

```javascript
const sass = require('sass');

function compileSass(inputFile, outputFile) {
  const result = sass.compile(inputFile, {
    style: 'compressed',
    sourceMap: false,
  });

  fs.writeFileSync(outputFile, result.css);
}
```

### Scripts de Watch

#### Mode Développement

```bash
# Watch TypeScript
npm run dev:ts    # node ./scripts/watch-js.js

# Watch SCSS
npm run dev:scss  # node ./scripts/watch-css.js

# Watch global
npm run dev       # concurrently "npm run dev:*"
```

#### Avantages des Scripts Personnalisés

- **Performance** : Compilation ultra-rapide avec esbuild
- **Flexibilité** : Configuration sur mesure
- **Simplicité** : Pas de configuration Webpack complexe
- **Contrôle** : Gestion fine du processus de build

## Architecture TypeScript

### Utilitaires Core (utils/)

#### Système de Fetch Avancé

```typescript
// public/ts/utils/fetch.ts
class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message: string,
    public response: Response,
    public data: any
  ) {
    super(message);
  }
}

const fetchAPI = async (url: string, options: RequestInit = {}) => {
  // Configuration avancée avec gestion d'erreurs
  const requestOptions = { ...options };

  // Auto-conversion JSON
  if (requestOptions.body && typeof requestOptions.body === 'object') {
    requestOptions.body = JSON.stringify(requestOptions.body);
    requestOptions.headers = {
      'Content-Type': 'application/json',
      ...requestOptions.headers,
    };
  }

  const response = await fetch(url, requestOptions);

  // Gestion de la réponse avec parsing automatique
  const contentType = response.headers.get('content-type');
  const text = await response.clone().text();
  const data = contentType?.includes('application/json') ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new ApiError(response.status, response.statusText, data.message || `Request failed`, response, data);
  }

  return { ok: response.ok, status: response.status, data, text };
};

// Méthodes utilitaires
export const fetchGET = (url: string, options = {}) => fetchAPI(url, { ...options, method: 'GET' });

export const fetchPOST = (url: string, body?: any, options = {}) => fetchAPI(url, { ...options, method: 'POST', body });
```

#### Gestionnaire de Formulaires

```typescript
// public/ts/utils/form.ts
class FormManager {
  constructor(
    private form: HTMLFormElement,
    private initialData: Record<string, any>
  ) {}

  // Extraction de données typées
  getFormData(): Record<string, any> {
    const data: Record<string, any> = {};
    const fields = this.getFormFields();

    fields.forEach((field) => {
      if (field instanceof HTMLInputElement) {
        this.handleInputField(field, data);
      } else if (field instanceof HTMLSelectElement) {
        this.handleSelectField(field, data);
      }
    });

    return data;
  }

  // Validation et affichage d'erreurs
  displayErrors(violations: Record<string, string[]>) {
    Object.entries(violations).forEach(([field, errors]) => {
      const fieldElement = this.form.querySelector(`[name="${field}"]`);
      if (fieldElement) {
        this.showFieldError(fieldElement, errors);
      }
    });
  }
}
```

### Scripts d'Administration (admin/)

#### Gestion des Utilisateurs

```typescript
// public/ts/admin/user.ts
class UserManager {
  private form: HTMLFormElement;
  private formManager: FormManager;

  constructor(formSelector: string) {
    this.form = document.querySelector(formSelector);
    this.formManager = new FormManager(this.form, {});
    this.init();
  }

  private async handleSubmit(event: Event) {
    event.preventDefault();

    const formData = this.formManager.getFormData();

    try {
      const response = await fetchPOST('/admin/user', formData);
      this.handleSuccess(response);
    } catch (error) {
      if (error instanceof ApiError) {
        this.handleApiError(error);
      }
    }
  }

  private handleApiError(error: ApiError) {
    if (error.status === 422 && error.data.violations) {
      this.formManager.displayErrors(error.data.violations);
    }
  }
}

// Initialisation automatique
document.addEventListener('DOMContentLoaded', () => {
  const userForm = document.querySelector('#user-form');
  if (userForm) {
    new UserManager('#user-form');
  }
});
```

#### Gestion des Règles d'Accès

```typescript
// public/ts/admin/features-access-rules.ts
class FeatureAccessManager {
  private async loadFeatures() {
    try {
      const response = await fetchGET('/admin/features-access-rules/list');
      this.renderFeatures(response.data);
    } catch (error) {
      console.error('Failed to load features:', error);
    }
  }

  private async deleteFeature(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette règle ?')) {
      return;
    }

    try {
      await fetchDELETE(`/admin/features-access-rules/${id}`);
      this.loadFeatures(); // Reload
    } catch (error) {
      console.error('Failed to delete feature:', error);
    }
  }
}
```

## Architecture SCSS

### Structure des Styles

#### Configuration et Thèmes

```scss
// public/scss/config/material/_variables.scss
$primary-color: #007bff;
$secondary-color: #6c757d;
$success-color: #28a745;

// Breakpoints responsive
$breakpoints: (
  'mobile': 576px,
  'tablet': 768px,
  'desktop': 992px,
  'large': 1200px,
);
```

#### Mixins Utilitaires

```scss
// public/scss/mixins/_utilities.scss
@mixin button-variant($color, $background, $border) {
  color: $color;
  background-color: $background;
  border-color: $border;

  &:hover {
    background-color: darken($background, 7.5%);
    border-color: darken($border, 10%);
  }
}

@mixin responsive($breakpoint) {
  @media (min-width: map-get($breakpoints, $breakpoint)) {
    @content;
  }
}
```

#### Composants Modulaires

```scss
// public/scss/components/_forms.scss
.form-control {
  display: block;
  width: 100%;
  padding: 0.375rem 0.75rem;
  font-size: 1rem;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;

  &:focus {
    border-color: $primary-color;
    box-shadow: 0 0 0 0.2rem rgba($primary-color, 0.25);
  }

  &.is-invalid {
    border-color: $danger-color;
  }
}
```

### Support RTL

#### Configuration RTL

```javascript
// webpack.config.js
const RtlCssPlugin = require('rtlcss-webpack-plugin');

.addPlugin(
  new RtlCssPlugin({
    filename: 'css/[name]-rtl.min.css',
  })
)
```

#### Styles RTL-Ready

```scss
.text-align-start {
  text-align: left;

  [dir='rtl'] & {
    text-align: right;
  }
}

.margin-start {
  margin-left: 1rem;

  [dir='rtl'] & {
    margin-left: 0;
    margin-right: 1rem;
  }
}
```

## Intégration avec le Backend

### Communication API

#### Endpoints Standards

```typescript
// Patterns d'URL cohérents
const API_ENDPOINTS = {
  users: '/admin/user',
  features: '/admin/features-access-rules',
  logs: '/admin/log',
};

// Gestion automatique des tokens CSRF
const getCsrfToken = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
```

#### Gestion des Erreurs

```typescript
// Traitement uniforme des erreurs API
const handleApiResponse = async (response: ApiResponse) => {
  if (!response.ok) {
    switch (response.status) {
      case 422:
        // Erreurs de validation
        displayValidationErrors(response.data.violations);
        break;
      case 403:
        // Accès refusé
        showAccessDeniedMessage();
        break;
      case 500:
        // Erreur serveur
        showServerErrorMessage();
        break;
    }
  }
};
```

### Templates Twig et Assets

#### Injection des Assets

```twig
{# templates/base.html.twig #}
<script type="module" src="{{ asset('js/utils/fetch.js') }}"></script>
<script type="module" src="{{ asset('js/admin/user.js') }}"></script>
<link href="{{ asset('css/app.min.css') }}" rel="stylesheet">
```

#### Configuration Dynamique

```twig
<script>
window.APP_CONFIG = {
    apiBaseUrl: '{{ app.request.schemeAndHttpHost }}',
    csrfToken: '{{ csrf_token('app') }}',
    locale: '{{ app.request.locale }}'
};
</script>
```

## Optimisation et Performance

### Compilation Optimisée

#### Production Build

```bash
# Minification et optimisation
npm run build  # CSS + JS minifiés

# Résultat :
# public/js-mini/    (JavaScript optimisé)
# public/css-mini/   (CSS optimisé)
```

#### Tree Shaking

```typescript
// Import sélectif pour réduire la taille
import { fetchPOST } from './utils/fetch.js';
// Pas d'import global
```

### Cache et Versioning

#### Stratégie de Cache

```php
// Versioning automatique des assets
public function getAssetVersion(): string {
    return filemtime($this->publicDir . '/js/app.js');
}
```

### Lazy Loading

```typescript
// Chargement conditionnel des modules
const loadAdminModule = async () => {
  if (document.querySelector('.admin-panel')) {
    const { UserManager } = await import('./admin/user.js');
    return new UserManager();
  }
};
```

## Bonnes Pratiques

### Organisation du Code

- **Un fichier = une responsabilité**
- **Imports explicites** plutôt que globaux
- **Classes TypeScript** pour les composants complexes
- **Fonctions utilitaires** réutilisables

### Gestion des Erreurs

- **Try/catch** systématique pour les appels API
- **Messages utilisateur** informatifs
- **Logs** en développement pour le debugging

### Performance

- **Compilation séparée** des modules
- **Minification** en production
- **Code splitting** par fonctionnalité

Cette architecture frontend moderne offre flexibilité, performance et maintenabilité pour une expérience développeur optimale.
