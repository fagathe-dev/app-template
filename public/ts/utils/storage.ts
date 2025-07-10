import { isJSON } from './string';

class LocalStorageHandler {
  static all<T>(): Record<string, T> {
    const items: Record<string, T> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        items[key] = this.getValue(value as string) as T;
      }
    }
    return items;
  }

  static getValue<T>(value: string): T | null {
    return (isJSON(value as string) ? JSON.parse(value as string) : value) as T;
  }

  static get<T>(key: string, defaultValue: T | null = null): T | null {
    const value = localStorage.getItem(key) as T;

    if (value === null) {
      return defaultValue;
    }

    return this.getValue(value as string);
  }

  static remove(key: string): void | false {
    if (!this.has(key)) {
      return false;
    }
    localStorage.removeItem(key);
  }

  static clear(): void {
    localStorage.clear();
  }

  static has<T>(key: string): boolean {
    const items: Record<string, T> = this.all();
    return Object.keys(items).includes(key);
  }

  static keys<T>(key: string): Array<string> {
    const items: Record<string, T> = this.all();
    return Object.keys(items);
  }

  static values<T>(key: string): Array<T> {
    const items: Record<string, T> = this.all();
    return Object.values(items) as Array<T>;
  }

  static set<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

class SessionStorageHandler {
  static all<T>(): Record<string, T> {
    const items: Record<string, T> = {};
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        const value = sessionStorage.getItem(key);
        items[key] = this.getValue(value as string) as T;
      }
    }
    return items;
  }

  static getValue<T>(value: string): T | null {
    return (isJSON(value as string) ? JSON.parse(value as string) : value) as T;
  }

  static get<T>(key: string, defaultValue: T | null = null): T | null {
    const value = sessionStorage.getItem(key) as T;

    if (value === null) {
      return defaultValue;
    }

    return this.getValue(value as string);
  }

  static remove(key: string): void | false {
    if (!this.has(key)) {
      return false;
    }
    sessionStorage.removeItem(key);
  }

  static clear(): void {
    sessionStorage.clear();
  }

  static has<T>(key: string): boolean {
    const items: Record<string, T> = this.all();
    return Object.keys(items).includes(key);
  }

  static keys<T>(key: string): Array<string> {
    const items: Record<string, T> = this.all();
    return Object.keys(items);
  }

  static values<T>(key: string): Array<T> {
    const items: Record<string, T> = this.all();
    return Object.values(items) as Array<T>;
  }

  static set<T>(key: string, value: T): void {
    sessionStorage.setItem(key, JSON.stringify(value));
  }
}

export { LocalStorageHandler, SessionStorageHandler };
