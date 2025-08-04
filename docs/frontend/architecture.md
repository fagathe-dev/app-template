# Architecture Frontend

## Vue d'ensemble

Ce document détaille l'architecture frontend de l'application, basée sur TypeScript, SCSS, et une approche modulaire avec compilation via esbuild et gestion d'assets via Webpack Encore.

## Stack Technologique

### Technologies principales

- **TypeScript 5.8** : Langage principal pour la logique métier
- **SCSS/Sass** : Préprocesseur CSS pour la stylisation
- **Webpack Encore** : Bundling et optimisation des assets
- **esbuild** : Compilation rapide TypeScript/JavaScript
- **ESLint + Prettier** : Linting et formatage du code
- **Jest** : Tests unitaires
- **Storybook** : Documentation des composants (optionnel)

### Outils de build

- **Node.js 18+** : Runtime JavaScript
- **npm/yarn** : Gestionnaire de packages
- **Webpack 5** : Module bundler
- **PostCSS** : Traitement CSS post-compilation
- **rtlcss** : Support RTL (Right-to-Left)

## Structure des Dossiers

### Organisation des assets

```
assets/
├── ts/                          # TypeScript sources
│   ├── components/              # Composants réutilisables
│   │   ├── forms/              # Composants de formulaires
│   │   ├── ui/                 # Composants UI génériques
│   │   ├── modals/             # Modales et overlays
│   │   └── charts/             # Graphiques et visualisations
│   ├── pages/                  # Scripts spécifiques aux pages
│   │   ├── auth/               # Pages d'authentification
│   │   ├── admin/              # Interface d'administration
│   │   ├── user/               # Espace utilisateur
│   │   └── public/             # Pages publiques
│   ├── services/               # Services et utilitaires
│   │   ├── api/                # Clients API
│   │   ├── utils/              # Fonctions utilitaires
│   │   ├── validation/         # Validation côté client
│   │   └── storage/            # Gestion du stockage local
│   ├── types/                  # Définitions TypeScript
│   │   ├── api.d.ts           # Types pour l'API
│   │   ├── components.d.ts    # Types des composants
│   │   └── global.d.ts        # Types globaux
│   ├── constants/              # Constantes de l'application
│   └── app.ts                  # Point d'entrée principal
├── scss/                       # SCSS sources
│   ├── abstracts/              # Variables, mixins, fonctions
│   │   ├── _variables.scss     # Variables globales
│   │   ├── _mixins.scss        # Mixins réutilisables
│   │   ├── _functions.scss     # Fonctions SCSS
│   │   └── _breakpoints.scss   # Points de rupture responsive
│   ├── base/                   # Styles de base
│   │   ├── _reset.scss         # Reset CSS
│   │   ├── _typography.scss    # Typographie
│   │   ├── _forms.scss         # Styles de formulaires
│   │   └── _utilities.scss     # Classes utilitaires
│   ├── components/             # Styles des composants
│   │   ├── _buttons.scss       # Boutons
│   │   ├── _cards.scss         # Cartes
│   │   ├── _modals.scss        # Modales
│   │   ├── _tables.scss        # Tableaux
│   │   └── _forms.scss         # Formulaires complexes
│   ├── layout/                 # Styles de mise en page
│   │   ├── _header.scss        # En-tête
│   │   ├── _footer.scss        # Pied de page
│   │   ├── _sidebar.scss       # Barre latérale
│   │   └── _grid.scss          # Système de grille
│   ├── pages/                  # Styles spécifiques aux pages
│   │   ├── _home.scss          # Page d'accueil
│   │   ├── _auth.scss          # Pages d'authentification
│   │   ├── _admin.scss         # Interface d'administration
│   │   └── _dashboard.scss     # Tableau de bord
│   ├── themes/                 # Thèmes et variations
│   │   ├── _light.scss         # Thème clair
│   │   ├── _dark.scss          # Thème sombre
│   │   └── _rtl.scss           # Support RTL
│   └── app.scss                # Point d'entrée principal
└── images/                     # Assets images
    ├── icons/                  # Icônes SVG
    ├── logos/                  # Logos de l'application
    └── backgrounds/            # Images de fond
```

### Structure des fichiers compilés

```
public/
├── css/                        # CSS compilé
│   ├── app.css                # CSS principal
│   ├── app.rtl.css            # Version RTL
│   └── chunks/                # CSS par chunks
├── js/                        # JavaScript compilé
│   ├── app.js                 # JavaScript principal
│   ├── admin.js               # Bundle administration
│   ├── auth.js                # Bundle authentification
│   └── chunks/                # Chunks dynamiques
├── css-mini/                  # CSS minifié (production)
├── js-mini/                   # JavaScript minifié (production)
└── manifest.json              # Manifest des assets
```

## Configuration de Build

### Configuration Webpack Encore

```javascript
// webpack.config.js
const Encore = require('@symfony/webpack-encore');
const path = require('path');

if (!Encore.isRuntimeEnvironmentConfigured()) {
  Encore.configureRuntimeEnvironment(process.env.NODE_ENV || 'dev');
}

Encore
  // Répertoire de sortie
  .setOutputPath('public/build/')
  .setPublicPath('/build')

  // Points d'entrée
  .addEntry('app', './assets/ts/app.ts')
  .addEntry('admin', './assets/ts/pages/admin/admin.ts')
  .addEntry('auth', './assets/ts/pages/auth/auth.ts')

  // CSS
  .addStyleEntry('app-css', './assets/scss/app.scss')
  .addStyleEntry('admin-css', './assets/scss/pages/_admin.scss')

  // Configuration
  .splitEntryChunks()
  .enableSingleRuntimeChunk()
  .cleanupOutputBeforeBuild()
  .enableBuildNotifications()
  .enableSourceMaps(!Encore.isProduction())
  .configureBabelPresetEnv((config) => {
    config.useBuiltIns = 'usage';
    config.corejs = 3;
  })

  // TypeScript
  .enableTypeScriptLoader()
  .configureTsConfigLoader()

  // SCSS
  .enableSassLoader()
  .enablePostCssLoader()

  // Optimisations
  .configureImageRule({
    type: 'asset',
    maxSize: 4 * 1024, // 4kb
  })

  // Environnement de production
  .configureDevServerOptions((options) => {
    options.allowedHosts = 'all';
    options.https = false;
  });

// Configuration personnalisée
if (Encore.isProduction()) {
  Encore.configureOptimization((config) => {
    config.minimizer = [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
          },
        },
      }),
      new CssMinimizerPlugin(),
    ];
  });
}

module.exports = Encore.getWebpackConfig();
```

### Configuration TypeScript

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": false,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./assets",
    "paths": {
      "@/*": ["ts/*"],
      "@components/*": ["ts/components/*"],
      "@services/*": ["ts/services/*"],
      "@types/*": ["ts/types/*"],
      "@utils/*": ["ts/services/utils/*"],
      "@constants/*": ["ts/constants/*"]
    }
  },
  "include": ["assets/ts/**/*", "assets/ts/**/*.ts"],
  "exclude": ["node_modules", "dist", "public/build"]
}
```

### Configuration SCSS

```scss
// assets/scss/abstracts/_variables.scss
// ========================================
// Variables globales de l'application
// ========================================

// Couleurs principales
$primary-color: #007bff;
$secondary-color: #6c757d;
$success-color: #28a745;
$danger-color: #dc3545;
$warning-color: #ffc107;
$info-color: #17a2b8;
$light-color: #f8f9fa;
$dark-color: #343a40;

// Couleurs de l'interface
$body-bg: #ffffff;
$body-color: #212529;
$link-color: $primary-color;
$link-hover-color: darken($primary-color, 15%);

// Typographie
$font-family-sans-serif:
  'Inter',
  -apple-system,
  BlinkMacSystemFont,
  'Segoe UI',
  'Roboto',
  sans-serif;
$font-family-monospace: 'JetBrains Mono', 'Fira Code', monospace;

$font-size-base: 1rem;
$font-size-sm: 0.875rem;
$font-size-lg: 1.125rem;
$font-size-xl: 1.25rem;

$font-weight-light: 300;
$font-weight-normal: 400;
$font-weight-medium: 500;
$font-weight-bold: 700;

$line-height-base: 1.5;
$line-height-sm: 1.25;
$line-height-lg: 1.75;

// Espacements
$spacer: 1rem;
$spacers: (
  0: 0,
  1: $spacer * 0.25,
  2: $spacer * 0.5,
  3: $spacer,
  4: $spacer * 1.5,
  5: $spacer * 3,
  6: $spacer * 4,
  7: $spacer * 5,
  8: $spacer * 6,
);

// Points de rupture responsive
$grid-breakpoints: (
  xs: 0,
  sm: 576px,
  md: 768px,
  lg: 992px,
  xl: 1200px,
  xxl: 1400px,
);

// Conteneurs
$container-max-widths: (
  sm: 540px,
  md: 720px,
  lg: 960px,
  xl: 1140px,
  xxl: 1320px,
);

// Bordures
$border-width: 1px;
$border-radius: 0.375rem;
$border-radius-sm: 0.25rem;
$border-radius-lg: 0.5rem;
$border-radius-pill: 50rem;

// Ombres
$box-shadow-sm: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
$box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
$box-shadow-lg: 0 1rem 3rem rgba(0, 0, 0, 0.175);

// Transitions
$transition-base: all 0.2s ease-in-out;
$transition-fade: opacity 0.15s linear;
$transition-collapse: height 0.35s ease;

// Z-index
$zindex-dropdown: 1000;
$zindex-sticky: 1020;
$zindex-fixed: 1030;
$zindex-modal-backdrop: 1040;
$zindex-modal: 1050;
$zindex-popover: 1060;
$zindex-tooltip: 1070;
```

## Architecture des Composants

### Composant de base TypeScript

```typescript
// assets/ts/components/base/Component.ts
export abstract class Component {
  protected element: HTMLElement;
  protected options: Record<string, any>;
  protected listeners: Map<string, EventListener[]> = new Map();

  constructor(element: HTMLElement | string, options: Record<string, any> = {}) {
    this.element = typeof element === 'string' ? document.querySelector(element)! : element;

    if (!this.element) {
      throw new Error('Element not found');
    }

    this.options = { ...this.getDefaultOptions(), ...options };
    this.init();
  }

  protected abstract getDefaultOptions(): Record<string, any>;

  protected init(): void {
    this.bindEvents();
    this.render();
  }

  protected bindEvents(): void {
    // À implémenter dans les classes filles
  }

  protected render(): void {
    // À implémenter dans les classes filles
  }

  protected addEventListener(event: string, listener: EventListener, element?: HTMLElement): void {
    const target = element || this.element;
    target.addEventListener(event, listener);

    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  protected emit(event: string, detail?: any): void {
    const customEvent = new CustomEvent(event, { detail, bubbles: true });
    this.element.dispatchEvent(customEvent);
  }

  protected querySelector<T extends HTMLElement>(selector: string): T | null {
    return this.element.querySelector<T>(selector);
  }

  protected querySelectorAll<T extends HTMLElement>(selector: string): NodeListOf<T> {
    return this.element.querySelectorAll<T>(selector);
  }

  public destroy(): void {
    this.listeners.forEach((listeners, event) => {
      listeners.forEach((listener) => {
        this.element.removeEventListener(event, listener);
      });
    });
    this.listeners.clear();
  }
}
```

### Composant de formulaire

```typescript
// assets/ts/components/forms/FormValidator.ts
import { Component } from '../base/Component';

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  custom?: (value: string) => string | null;
}

interface ValidationRules {
  [field: string]: ValidationRule;
}

export class FormValidator extends Component {
  private rules: ValidationRules = {};
  private errors: Map<string, string> = new Map();

  protected getDefaultOptions() {
    return {
      validateOnSubmit: true,
      validateOnBlur: true,
      showErrorsInline: true,
      errorClass: 'is-invalid',
      successClass: 'is-valid',
    };
  }

  public addRule(field: string, rule: ValidationRule): void {
    this.rules[field] = rule;
  }

  public addRules(rules: ValidationRules): void {
    this.rules = { ...this.rules, ...rules };
  }

  protected bindEvents(): void {
    if (this.options.validateOnSubmit) {
      this.addEventListener('submit', this.handleSubmit.bind(this));
    }

    if (this.options.validateOnBlur) {
      Object.keys(this.rules).forEach((fieldName) => {
        const field = this.querySelector<HTMLInputElement>(`[name="${fieldName}"]`);
        if (field) {
          field.addEventListener('blur', () => this.validateField(fieldName));
          field.addEventListener('input', () => this.clearFieldError(fieldName));
        }
      });
    }
  }

  private handleSubmit(event: Event): void {
    event.preventDefault();

    if (this.validate()) {
      this.emit('form:valid', { form: this.element });
      // Laisser le formulaire se soumettre normalement
      (this.element as HTMLFormElement).submit();
    } else {
      this.emit('form:invalid', { errors: Object.fromEntries(this.errors) });
    }
  }

  public validate(): boolean {
    this.errors.clear();

    Object.keys(this.rules).forEach((fieldName) => {
      this.validateField(fieldName);
    });

    return this.errors.size === 0;
  }

  private validateField(fieldName: string): boolean {
    const field = this.querySelector<HTMLInputElement>(`[name="${fieldName}"]`);
    const rule = this.rules[fieldName];

    if (!field || !rule) return true;

    const value = field.value.trim();
    let error: string | null = null;

    // Validation required
    if (rule.required && !value) {
      error = 'Ce champ est requis';
    }
    // Validation longueur minimale
    else if (rule.minLength && value.length < rule.minLength) {
      error = `Minimum ${rule.minLength} caractères requis`;
    }
    // Validation longueur maximale
    else if (rule.maxLength && value.length > rule.maxLength) {
      error = `Maximum ${rule.maxLength} caractères autorisés`;
    }
    // Validation email
    else if (rule.email && value && !this.isValidEmail(value)) {
      error = "Format d'email invalide";
    }
    // Validation pattern
    else if (rule.pattern && value && !rule.pattern.test(value)) {
      error = 'Format invalide';
    }
    // Validation personnalisée
    else if (rule.custom && value) {
      error = rule.custom(value);
    }

    if (error) {
      this.errors.set(fieldName, error);
      this.showFieldError(field, error);
      return false;
    } else {
      this.showFieldSuccess(field);
      return true;
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private showFieldError(field: HTMLElement, error: string): void {
    field.classList.remove(this.options.successClass);
    field.classList.add(this.options.errorClass);

    if (this.options.showErrorsInline) {
      this.showInlineError(field, error);
    }
  }

  private showFieldSuccess(field: HTMLElement): void {
    field.classList.remove(this.options.errorClass);
    field.classList.add(this.options.successClass);
    this.hideInlineError(field);
  }

  private clearFieldError(fieldName: string): void {
    const field = this.querySelector<HTMLInputElement>(`[name="${fieldName}"]`);
    if (field) {
      field.classList.remove(this.options.errorClass, this.options.successClass);
      this.hideInlineError(field);
    }
    this.errors.delete(fieldName);
  }

  private showInlineError(field: HTMLElement, error: string): void {
    this.hideInlineError(field);

    const errorElement = document.createElement('div');
    errorElement.className = 'invalid-feedback';
    errorElement.textContent = error;

    field.parentNode?.insertBefore(errorElement, field.nextSibling);
  }

  private hideInlineError(field: HTMLElement): void {
    const errorElement = field.parentNode?.querySelector('.invalid-feedback');
    if (errorElement) {
      errorElement.remove();
    }
  }

  public getErrors(): Record<string, string> {
    return Object.fromEntries(this.errors);
  }

  public hasErrors(): boolean {
    return this.errors.size > 0;
  }
}
```

### Composant de modal

```typescript
// assets/ts/components/ui/Modal.ts
import { Component } from '../base/Component';

export class Modal extends Component {
  private backdrop?: HTMLElement;
  private isOpen = false;

  protected getDefaultOptions() {
    return {
      backdrop: true,
      keyboard: true,
      focus: true,
      closeOnBackdropClick: true,
      closeOnEscape: true,
      animation: true,
      appendTo: document.body,
    };
  }

  protected bindEvents(): void {
    // Boutons de fermeture
    this.querySelectorAll('[data-modal-close]').forEach((button) => {
      this.addEventListener('click', () => this.close(), button);
    });

    // Échappement clavier
    if (this.options.closeOnEscape) {
      this.addEventListener('keydown', this.handleKeydown.bind(this));
    }

    // Clic sur le backdrop
    if (this.options.closeOnBackdropClick) {
      this.addEventListener('click', this.handleBackdropClick.bind(this));
    }
  }

  private handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isOpen) {
      this.close();
    }
  }

  private handleBackdropClick(event: MouseEvent): void {
    if (event.target === this.element) {
      this.close();
    }
  }

  public open(): void {
    if (this.isOpen) return;

    this.emit('modal:before-open');

    // Créer le backdrop
    if (this.options.backdrop) {
      this.createBackdrop();
    }

    // Afficher la modal
    this.element.style.display = 'block';
    this.element.classList.add('show');

    // Animation d'entrée
    if (this.options.animation) {
      this.element.classList.add('fade');
      // Force reflow
      this.element.offsetHeight;
      this.element.classList.add('show');
    }

    // Focus management
    if (this.options.focus) {
      this.setFocus();
    }

    // Prevent body scroll
    document.body.classList.add('modal-open');

    this.isOpen = true;
    this.emit('modal:opened');
  }

  public close(): void {
    if (!this.isOpen) return;

    this.emit('modal:before-close');

    // Animation de sortie
    if (this.options.animation) {
      this.element.classList.remove('show');

      // Attendre la fin de l'animation
      setTimeout(() => {
        this.finalizeClose();
      }, 300);
    } else {
      this.finalizeClose();
    }
  }

  private finalizeClose(): void {
    this.element.style.display = 'none';
    this.element.classList.remove('fade');

    // Supprimer le backdrop
    if (this.backdrop) {
      this.backdrop.remove();
      this.backdrop = undefined;
    }

    // Restaurer le scroll du body
    document.body.classList.remove('modal-open');

    this.isOpen = false;
    this.emit('modal:closed');
  }

  private createBackdrop(): void {
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'modal-backdrop fade show';
    this.options.appendTo.appendChild(this.backdrop);
  }

  private setFocus(): void {
    const focusableElement =
      this.querySelector('[autofocus]') ||
      this.querySelector('input, button, select, textarea, [tabindex]:not([tabindex="-1"])');

    if (focusableElement) {
      (focusableElement as HTMLElement).focus();
    } else {
      this.element.focus();
    }
  }

  public toggle(): void {
    this.isOpen ? this.close() : this.open();
  }

  public isVisible(): boolean {
    return this.isOpen;
  }
}
```

## Services Frontend

### Service API Client

```typescript
// assets/ts/services/api/ApiClient.ts
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retry?: number;
}

export class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private token?: string;

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  public setAuthToken(token: string): void {
    this.token = token;
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  public removeAuthToken(): void {
    this.token = undefined;
    delete this.defaultHeaders['Authorization'];
  }

  public async request<T = any>(endpoint: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    const url = this.baseURL + endpoint;
    const { method = 'GET', headers = {}, body, timeout = 10000, retry = 0 } = config;

    const requestHeaders = {
      ...this.defaultHeaders,
      ...headers,
    };

    const requestConfig: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (body && method !== 'GET') {
      requestConfig.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...requestConfig,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || `HTTP ${response.status}`);
      }

      return responseData;
    } catch (error) {
      if (retry > 0 && this.shouldRetry(error)) {
        await this.delay(1000 * (3 - retry)); // Backoff progressif
        return this.request(endpoint, { ...config, retry: retry - 1 });
      }

      throw error;
    }
  }

  public async get<T = any>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  public async post<T = any>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body, headers });
  }

  public async put<T = any>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body, headers });
  }

  public async delete<T = any>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }

  private shouldRetry(error: any): boolean {
    // Retry sur les erreurs réseau ou les timeouts
    return error.name === 'AbortError' || error.message.includes('fetch') || error.message.includes('network');
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Instance globale
export const apiClient = new ApiClient();
```

### Service de stockage local

```typescript
// assets/ts/services/storage/StorageService.ts
export class StorageService {
  private prefix: string;

  constructor(prefix: string = 'app_') {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return this.prefix + key;
  }

  public set(key: string, value: any, expireInMinutes?: number): void {
    const item = {
      value,
      timestamp: Date.now(),
      expires: expireInMinutes ? Date.now() + expireInMinutes * 60 * 1000 : null,
    };

    try {
      localStorage.setItem(this.getKey(key), JSON.stringify(item));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  public get<T = any>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.getKey(key));
      if (!item) return null;

      const parsed = JSON.parse(item);

      // Vérifier l'expiration
      if (parsed.expires && Date.now() > parsed.expires) {
        this.remove(key);
        return null;
      }

      return parsed.value;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }

  public remove(key: string): void {
    localStorage.removeItem(this.getKey(key));
  }

  public clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }

  public has(key: string): boolean {
    return this.get(key) !== null;
  }

  // Session storage methods
  public setSession(key: string, value: any): void {
    try {
      sessionStorage.setItem(this.getKey(key), JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to sessionStorage:', error);
    }
  }

  public getSession<T = any>(key: string): T | null {
    try {
      const item = sessionStorage.getItem(this.getKey(key));
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error reading from sessionStorage:', error);
      return null;
    }
  }

  public removeSession(key: string): void {
    sessionStorage.removeItem(this.getKey(key));
  }
}

// Instance globale
export const storage = new StorageService();
```

Cette architecture frontend modulaire et bien structurée permet un développement maintenable et évolutif avec TypeScript, tout en conservant des performances optimales grâce à la compilation esbuild et à la gestion intelligente des assets.
