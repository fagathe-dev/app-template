# Gestion d'État Frontend

## Vue d'ensemble

Ce document décrit la gestion d'état dans l'application frontend, incluant les patterns de données, la communication entre composants, les services d'état et la synchronisation avec l'API.

## Architecture de l'État

### Principes de gestion d'état

- **État local** : Géré au niveau des composants individuels
- **État partagé** : Géré par des services centralisés
- **État persistant** : Synchronisé avec le localStorage/sessionStorage
- **État serveur** : Synchronisé avec l'API REST

### Hiérarchie des états

```
Application State
├── User State              # Authentification et profil utilisateur
├── UI State               # Interface utilisateur (modales, sidebars, etc.)
├── Data State             # Données métier (entités, listes, etc.)
├── Cache State            # Cache des données API
└── Preference State       # Préférences utilisateur
```

## Services de Gestion d'État

### StateManager - Gestionnaire Central

```typescript
// assets/ts/services/StateManager.ts
import { EventEmitter } from '../core/EventEmitter';

interface StateChange<T = any> {
  key: string;
  oldValue: T;
  newValue: T;
  timestamp: number;
}

export class StateManager extends EventEmitter {
  private state: Map<string, any> = new Map();
  private watchers: Map<string, Set<Function>> = new Map();
  private middlewares: Array<(change: StateChange) => void> = [];

  constructor() {
    super();
    this.initializeFromStorage();
  }

  private initializeFromStorage(): void {
    try {
      const stored = localStorage.getItem('app_state');
      if (stored) {
        const parsedState = JSON.parse(stored);
        Object.entries(parsedState).forEach(([key, value]) => {
          this.state.set(key, value);
        });
      }
    } catch (error) {
      console.warn("Erreur lors du chargement de l'état depuis le stockage:", error);
    }
  }

  public get<T>(key: string, defaultValue?: T): T {
    return this.state.get(key) ?? defaultValue;
  }

  public set<T>(key: string, value: T, persist = true): void {
    const oldValue = this.state.get(key);

    if (oldValue === value) return;

    this.state.set(key, value);

    const change: StateChange<T> = {
      key,
      oldValue,
      newValue: value,
      timestamp: Date.now(),
    };

    // Exécuter les middlewares
    this.middlewares.forEach((middleware) => {
      try {
        middleware(change);
      } catch (error) {
        console.error("Erreur dans le middleware d'état:", error);
      }
    });

    // Notifier les watchers
    this.notifyWatchers(key, change);

    // Persister si nécessaire
    if (persist) {
      this.persistToStorage();
    }

    // Émettre l'événement global
    this.emit('state:changed', change);
    this.emit(`state:changed:${key}`, change);
  }

  public update<T>(key: string, updater: (current: T) => T, persist = true): void {
    const current = this.get<T>(key);
    const updated = updater(current);
    this.set(key, updated, persist);
  }

  public remove(key: string): void {
    if (this.state.has(key)) {
      const oldValue = this.state.get(key);
      this.state.delete(key);

      const change: StateChange = {
        key,
        oldValue,
        newValue: undefined,
        timestamp: Date.now(),
      };

      this.notifyWatchers(key, change);
      this.persistToStorage();
      this.emit('state:removed', change);
    }
  }

  public watch<T>(key: string, callback: (change: StateChange<T>) => void): () => void {
    if (!this.watchers.has(key)) {
      this.watchers.set(key, new Set());
    }

    this.watchers.get(key)!.add(callback);

    // Retourner une fonction de nettoyage
    return () => {
      const keyWatchers = this.watchers.get(key);
      if (keyWatchers) {
        keyWatchers.delete(callback);
        if (keyWatchers.size === 0) {
          this.watchers.delete(key);
        }
      }
    };
  }

  private notifyWatchers<T>(key: string, change: StateChange<T>): void {
    const keyWatchers = this.watchers.get(key);
    if (keyWatchers) {
      keyWatchers.forEach((callback) => {
        try {
          callback(change);
        } catch (error) {
          console.error("Erreur dans le watcher d'état:", error);
        }
      });
    }
  }

  public addMiddleware(middleware: (change: StateChange) => void): void {
    this.middlewares.push(middleware);
  }

  private persistToStorage(): void {
    try {
      const stateObj = Object.fromEntries(this.state);
      localStorage.setItem('app_state', JSON.stringify(stateObj));
    } catch (error) {
      console.warn("Erreur lors de la sauvegarde de l'état:", error);
    }
  }

  public getSnapshot(): Record<string, any> {
    return Object.fromEntries(this.state);
  }

  public restore(snapshot: Record<string, any>): void {
    this.state.clear();
    Object.entries(snapshot).forEach(([key, value]) => {
      this.state.set(key, value);
    });
    this.persistToStorage();
    this.emit('state:restored', snapshot);
  }

  public clear(): void {
    this.state.clear();
    this.watchers.clear();
    localStorage.removeItem('app_state');
    this.emit('state:cleared');
  }
}

// Instance globale
export const stateManager = new StateManager();
```

### UserStateService - Gestion de l'État Utilisateur

```typescript
// assets/ts/services/UserStateService.ts
import { stateManager } from './StateManager';
import { ApiClient } from './ApiClient';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
  preferences: UserPreferences;
}

interface UserPreferences {
  theme: 'light' | 'dark';
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  tokenExpiry: number | null;
}

export class UserStateService {
  private static readonly AUTH_STATE_KEY = 'auth_state';
  private static readonly USER_PREFERENCES_KEY = 'user_preferences';

  constructor(private apiClient: ApiClient) {
    this.initializeAuthState();
    this.setupTokenRefresh();
  }

  private initializeAuthState(): void {
    const authState = stateManager.get<AuthState>(UserStateService.AUTH_STATE_KEY, {
      isAuthenticated: false,
      user: null,
      token: null,
      refreshToken: null,
      tokenExpiry: null,
    });

    // Vérifier si le token est encore valide
    if (authState.token && authState.tokenExpiry) {
      if (Date.now() > authState.tokenExpiry) {
        this.logout();
      } else {
        // Configurer le token dans l'API client
        this.apiClient.setAuthToken(authState.token);
      }
    }
  }

  private setupTokenRefresh(): void {
    // Vérifier le token toutes les minutes
    setInterval(() => {
      this.checkTokenExpiry();
    }, 60000);
  }

  private async checkTokenExpiry(): Promise<void> {
    const authState = this.getAuthState();

    if (!authState.isAuthenticated || !authState.tokenExpiry) return;

    // Rafraîchir le token 5 minutes avant expiration
    const fiveMinutes = 5 * 60 * 1000;
    if (Date.now() > authState.tokenExpiry - fiveMinutes) {
      await this.refreshToken();
    }
  }

  public async login(email: string, password: string): Promise<void> {
    try {
      const response = await this.apiClient.post('/auth/login', {
        email,
        password,
      });

      const { user, token, refreshToken, expiresIn } = response;
      const tokenExpiry = Date.now() + expiresIn * 1000;

      this.setAuthState({
        isAuthenticated: true,
        user,
        token,
        refreshToken,
        tokenExpiry,
      });

      this.apiClient.setAuthToken(token);

      stateManager.emit('user:logged-in', { user });
    } catch (error) {
      stateManager.emit('user:login-failed', { error });
      throw error;
    }
  }

  public async logout(): Promise<void> {
    const authState = this.getAuthState();

    if (authState.refreshToken) {
      try {
        await this.apiClient.post('/auth/logout', {
          refreshToken: authState.refreshToken,
        });
      } catch (error) {
        console.warn('Erreur lors de la déconnexion côté serveur:', error);
      }
    }

    this.setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
      refreshToken: null,
      tokenExpiry: null,
    });

    this.apiClient.removeAuthToken();
    stateManager.emit('user:logged-out');
  }

  public async refreshToken(): Promise<void> {
    const authState = this.getAuthState();

    if (!authState.refreshToken) {
      throw new Error('Aucun refresh token disponible');
    }

    try {
      const response = await this.apiClient.post('/auth/refresh', {
        refreshToken: authState.refreshToken,
      });

      const { token, refreshToken, expiresIn } = response;
      const tokenExpiry = Date.now() + expiresIn * 1000;

      this.updateAuthState({
        token,
        refreshToken,
        tokenExpiry,
      });

      this.apiClient.setAuthToken(token);

      stateManager.emit('user:token-refreshed');
    } catch (error) {
      stateManager.emit('user:token-refresh-failed', { error });
      await this.logout();
      throw error;
    }
  }

  public async updateProfile(profileData: Partial<User>): Promise<void> {
    try {
      const response = await this.apiClient.put('/user/profile', profileData);

      this.updateAuthState({
        user: response.user,
      });

      stateManager.emit('user:profile-updated', { user: response.user });
    } catch (error) {
      stateManager.emit('user:profile-update-failed', { error });
      throw error;
    }
  }

  public async updatePreferences(preferences: Partial<UserPreferences>): Promise<void> {
    const currentUser = this.getUser();
    if (!currentUser) throw new Error('Utilisateur non connecté');

    const updatedPreferences = {
      ...currentUser.preferences,
      ...preferences,
    };

    try {
      await this.apiClient.put('/user/preferences', updatedPreferences);

      this.updateAuthState({
        user: {
          ...currentUser,
          preferences: updatedPreferences,
        },
      });

      stateManager.set(UserStateService.USER_PREFERENCES_KEY, updatedPreferences);
      stateManager.emit('user:preferences-updated', { preferences: updatedPreferences });
    } catch (error) {
      stateManager.emit('user:preferences-update-failed', { error });
      throw error;
    }
  }

  // Getters
  public isAuthenticated(): boolean {
    return this.getAuthState().isAuthenticated;
  }

  public getUser(): User | null {
    return this.getAuthState().user;
  }

  public getToken(): string | null {
    return this.getAuthState().token;
  }

  public getUserPreferences(): UserPreferences | null {
    const user = this.getUser();
    return user ? user.preferences : null;
  }

  public hasRole(role: string): boolean {
    const user = this.getUser();
    return user ? user.roles.includes(role) : false;
  }

  public hasPermission(permission: string): boolean {
    const user = this.getUser();
    return user ? user.permissions.includes(permission) : false;
  }

  public hasAnyRole(roles: string[]): boolean {
    const user = this.getUser();
    return user ? roles.some((role) => user.roles.includes(role)) : false;
  }

  public hasAllRoles(roles: string[]): boolean {
    const user = this.getUser();
    return user ? roles.every((role) => user.roles.includes(role)) : false;
  }

  // Helpers privés
  private getAuthState(): AuthState {
    return stateManager.get<AuthState>(UserStateService.AUTH_STATE_KEY, {
      isAuthenticated: false,
      user: null,
      token: null,
      refreshToken: null,
      tokenExpiry: null,
    });
  }

  private setAuthState(authState: AuthState): void {
    stateManager.set(UserStateService.AUTH_STATE_KEY, authState);
  }

  private updateAuthState(updates: Partial<AuthState>): void {
    const currentState = this.getAuthState();
    this.setAuthState({ ...currentState, ...updates });
  }

  // Watchers
  public watchAuthState(callback: (authState: AuthState) => void): () => void {
    return stateManager.watch(UserStateService.AUTH_STATE_KEY, (change) => {
      callback(change.newValue);
    });
  }

  public watchUser(callback: (user: User | null) => void): () => void {
    return stateManager.watch(UserStateService.AUTH_STATE_KEY, (change) => {
      callback(change.newValue?.user || null);
    });
  }
}
```

### DataStateService - Gestion des Données Métier

```typescript
// assets/ts/services/DataStateService.ts
import { stateManager } from './StateManager';
import { ApiClient } from './ApiClient';

interface DataCollection<T> {
  items: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  loading: boolean;
  error: string | null;
  lastFetch: number | null;
}

interface EntityState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastFetch: number | null;
}

export class DataStateService {
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(private apiClient: ApiClient) {}

  // Gestion des collections
  public async fetchCollection<T>(
    endpoint: string,
    stateKey: string,
    params?: Record<string, any>,
    options?: { force?: boolean; append?: boolean }
  ): Promise<T[]> {
    const collection = this.getCollection<T>(stateKey);

    // Vérifier le cache
    if (!options?.force && collection.lastFetch && !this.isCacheExpired(collection.lastFetch)) {
      return collection.items;
    }

    this.updateCollection(stateKey, { loading: true, error: null });

    try {
      const response = await this.apiClient.get(endpoint, { params });
      const { data, pagination } = response;

      const items = options?.append ? [...collection.items, ...data] : data;

      this.updateCollection(stateKey, {
        items,
        pagination,
        loading: false,
        error: null,
        lastFetch: Date.now(),
      });

      stateManager.emit(`data:collection-updated:${stateKey}`, { items, pagination });

      return items;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur de chargement';

      this.updateCollection(stateKey, {
        loading: false,
        error: errorMessage,
      });

      stateManager.emit(`data:collection-error:${stateKey}`, { error: errorMessage });

      throw error;
    }
  }

  public async fetchEntity<T>(endpoint: string, stateKey: string, options?: { force?: boolean }): Promise<T> {
    const entity = this.getEntity<T>(stateKey);

    // Vérifier le cache
    if (!options?.force && entity.lastFetch && !this.isCacheExpired(entity.lastFetch) && entity.data) {
      return entity.data;
    }

    this.updateEntity(stateKey, { loading: true, error: null });

    try {
      const data = await this.apiClient.get(endpoint);

      this.updateEntity(stateKey, {
        data,
        loading: false,
        error: null,
        lastFetch: Date.now(),
      });

      stateManager.emit(`data:entity-updated:${stateKey}`, { data });

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur de chargement';

      this.updateEntity(stateKey, {
        loading: false,
        error: errorMessage,
      });

      stateManager.emit(`data:entity-error:${stateKey}`, { error: errorMessage });

      throw error;
    }
  }

  public async createEntity<T>(endpoint: string, data: Partial<T>, collectionStateKey?: string): Promise<T> {
    try {
      const response = await this.apiClient.post(endpoint, data);

      // Ajouter à la collection si spécifiée
      if (collectionStateKey) {
        this.addToCollection(collectionStateKey, response);
      }

      stateManager.emit('data:entity-created', { data: response });

      return response;
    } catch (error) {
      stateManager.emit('data:entity-create-error', { error });
      throw error;
    }
  }

  public async updateEntity<T>(
    endpoint: string,
    data: Partial<T>,
    entityStateKey?: string,
    collectionStateKey?: string
  ): Promise<T> {
    try {
      const response = await this.apiClient.put(endpoint, data);

      // Mettre à jour l'entité si spécifiée
      if (entityStateKey) {
        this.setEntity(entityStateKey, response);
      }

      // Mettre à jour dans la collection si spécifiée
      if (collectionStateKey) {
        this.updateInCollection(collectionStateKey, response);
      }

      stateManager.emit('data:entity-updated', { data: response });

      return response;
    } catch (error) {
      stateManager.emit('data:entity-update-error', { error });
      throw error;
    }
  }

  public async deleteEntity<T extends { id: any }>(
    endpoint: string,
    entity: T,
    entityStateKey?: string,
    collectionStateKey?: string
  ): Promise<void> {
    try {
      await this.apiClient.delete(endpoint);

      // Supprimer l'entité si spécifiée
      if (entityStateKey) {
        this.clearEntity(entityStateKey);
      }

      // Supprimer de la collection si spécifiée
      if (collectionStateKey) {
        this.removeFromCollection(collectionStateKey, entity.id);
      }

      stateManager.emit('data:entity-deleted', { entity });
    } catch (error) {
      stateManager.emit('data:entity-delete-error', { error });
      throw error;
    }
  }

  // Helpers pour les collections
  public getCollection<T>(stateKey: string): DataCollection<T> {
    return stateManager.get(`data:collection:${stateKey}`, {
      items: [],
      loading: false,
      error: null,
      lastFetch: null,
    });
  }

  public updateCollection<T>(stateKey: string, updates: Partial<DataCollection<T>>): void {
    const current = this.getCollection<T>(stateKey);
    stateManager.set(`data:collection:${stateKey}`, { ...current, ...updates });
  }

  public addToCollection<T>(stateKey: string, item: T): void {
    const collection = this.getCollection<T>(stateKey);
    this.updateCollection(stateKey, {
      items: [item, ...collection.items],
    });
  }

  public updateInCollection<T extends { id: any }>(stateKey: string, item: T): void {
    const collection = this.getCollection<T>(stateKey);
    const items = collection.items.map((existing) => (existing.id === item.id ? item : existing));
    this.updateCollection(stateKey, { items });
  }

  public removeFromCollection<T extends { id: any }>(stateKey: string, id: any): void {
    const collection = this.getCollection<T>(stateKey);
    const items = collection.items.filter((item) => item.id !== id);
    this.updateCollection(stateKey, { items });
  }

  // Helpers pour les entités
  public getEntity<T>(stateKey: string): EntityState<T> {
    return stateManager.get(`data:entity:${stateKey}`, {
      data: null,
      loading: false,
      error: null,
      lastFetch: null,
    });
  }

  public updateEntity<T>(stateKey: string, updates: Partial<EntityState<T>>): void {
    const current = this.getEntity<T>(stateKey);
    stateManager.set(`data:entity:${stateKey}`, { ...current, ...updates });
  }

  public setEntity<T>(stateKey: string, data: T): void {
    this.updateEntity(stateKey, {
      data,
      error: null,
      lastFetch: Date.now(),
    });
  }

  public clearEntity(stateKey: string): void {
    stateManager.remove(`data:entity:${stateKey}`);
  }

  // Cache utilities
  private isCacheExpired(lastFetch: number): boolean {
    return Date.now() - lastFetch > DataStateService.CACHE_DURATION;
  }

  public invalidateCache(pattern?: string): void {
    const snapshot = stateManager.getSnapshot();

    Object.keys(snapshot).forEach((key) => {
      if (key.startsWith('data:')) {
        if (!pattern || key.includes(pattern)) {
          stateManager.remove(key);
        }
      }
    });

    stateManager.emit('data:cache-invalidated', { pattern });
  }

  // Watchers
  public watchCollection<T>(stateKey: string, callback: (collection: DataCollection<T>) => void): () => void {
    return stateManager.watch(`data:collection:${stateKey}`, (change) => {
      callback(change.newValue);
    });
  }

  public watchEntity<T>(stateKey: string, callback: (entity: EntityState<T>) => void): () => void {
    return stateManager.watch(`data:entity:${stateKey}`, (change) => {
      callback(change.newValue);
    });
  }
}
```

## Patterns de Communication

### Event Bus - Communication Inter-Composants

```typescript
// assets/ts/services/EventBus.ts
export interface EventBusEvent {
  type: string;
  payload?: any;
  timestamp: number;
  source?: string;
}

export class EventBus {
  private listeners: Map<string, Set<Function>> = new Map();
  private history: EventBusEvent[] = [];
  private maxHistorySize = 100;

  public on(eventType: string, callback: Function): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType)!.add(callback);

    // Retourner une fonction de désinscription
    return () => {
      const eventListeners = this.listeners.get(eventType);
      if (eventListeners) {
        eventListeners.delete(callback);
        if (eventListeners.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  public once(eventType: string, callback: Function): void {
    const unsubscribe = this.on(eventType, (...args: any[]) => {
      callback(...args);
      unsubscribe();
    });
  }

  public emit(eventType: string, payload?: any, source?: string): void {
    const event: EventBusEvent = {
      type: eventType,
      payload,
      timestamp: Date.now(),
      source,
    };

    // Ajouter à l'historique
    this.history.push(event);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    // Notifier les listeners
    const eventListeners = this.listeners.get(eventType);
    if (eventListeners) {
      eventListeners.forEach((callback) => {
        try {
          callback(event);
        } catch (error) {
          console.error(`Erreur dans le listener pour ${eventType}:`, error);
        }
      });
    }

    // Notifier les listeners wildcard
    const wildcardListeners = this.listeners.get('*');
    if (wildcardListeners) {
      wildcardListeners.forEach((callback) => {
        try {
          callback(event);
        } catch (error) {
          console.error('Erreur dans le listener wildcard:', error);
        }
      });
    }
  }

  public off(eventType: string, callback?: Function): void {
    if (!callback) {
      this.listeners.delete(eventType);
      return;
    }

    const eventListeners = this.listeners.get(eventType);
    if (eventListeners) {
      eventListeners.delete(callback);
      if (eventListeners.size === 0) {
        this.listeners.delete(eventType);
      }
    }
  }

  public getHistory(eventType?: string): EventBusEvent[] {
    if (eventType) {
      return this.history.filter((event) => event.type === eventType);
    }
    return [...this.history];
  }

  public clear(): void {
    this.listeners.clear();
    this.history = [];
  }
}

// Instance globale
export const eventBus = new EventBus();
```

Cette architecture de gestion d'état offre une approche structurée et scalable pour gérer les données et les interactions dans l'application frontend, avec une séparation claire des responsabilités et des patterns de communication robustes.
