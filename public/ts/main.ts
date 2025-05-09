const $ = (selector: string): HTMLElement | NodeListOf<Element> | null => {
  const elements = document.querySelectorAll(selector) as NodeListOf<HTMLElement>;

  if (elements.length === 0) {
    return null;
  }

  if (elements.length === 1) {
    return elements[0] as HTMLElement;
  }

  return elements;
};

class Str {
  static isJSON(value: string): boolean {
    try {
      JSON.parse(value);
      return true;
    } catch (error) {
      return false;
    }
  }

  static capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  static random(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  static sanitize = (str: string): string => {
    // Normaliser la chaîne de caractères
    // Remplacer les caractères accentués par leur équivalent non accentué
    // Exemple : "é" devient "e", "ç" devient "c", etc.
    let chaine = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    // Retirer les guillemets et les apostrophes
    chaine = chaine.replace(/[-"'"]/g, '');
    // Retirer les traits d'union et mettre en majuscules
    return chaine.replace(/-/g, '').toLowerCase();
  };

  static slugify(str: string, separateur: string = '-'): string {
    let chaine = this.sanitize(str);
    return chaine.split(' ').join(separateur);
  }

  static truncate(str: string, length: number): string {
    return str.length > length ? str.slice(0, length) + '...' : str;
  }

  static repeat(str: string, times: number): string {
    return new Array(times + 1).join(str);
  }

  static countOccurrences(str: string, subStr: string): number {
    return str.toLowerCase().split(subStr).length - 1;
  }

  static removeWhitespace(str: string): string {
    return str.replace(/\s+/g, '');
  }

  static camelCase(str: string): string {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => (index === 0 ? match.toLowerCase() : match.toUpperCase()))
      .replace(/\s+/g, '');
  }

  static snakeCase(str: string): string {
    return str.replace(/\s+/g, '_').toLowerCase();
  }

  static kebabCase(str: string): string {
    return str.replace(/\s+/g, '-').toLowerCase();
  }

  static encodeBase64(value: string): string {
    return btoa(value);
  }

  static decodeBase64(value: string): string {
    return atob(value);
  }

  static reverse(str: string): string {
    return str.split('').reverse().join('');
  }

  static isEmpty(str: string): boolean {
    return str.trim().length === 0;
  }

  static isURL(value: string): boolean {
    const regex = /^(ftp|http|https):\/\/[^ "]+$/;
    return regex.test(value);
  }

  static isNumber(value: string): boolean {
    return !isNaN(Number(value));
  }

  static isEmail(value: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(value);
  }
}

interface URLParam {
  key: string;
  value: string;
}

class URLHandler {
  /**
   * @description Get the current URL as an URL object
   * @returns {URL}
   */
  static getObjectURL = (): URL => {
    const url = window.location.href;
    return new URL(url);
  };

  /**
   * Get the URL base from the current URL or from a given URL
   *
   * @param {string} url
   * @returns {string}
   */
  static getBaseURL = (url: string | undefined = undefined): string =>
    url === undefined ? window.location.origin : new URL(url).origin;

  /**
   * @description Get the URI path from the current URL or from a given URL
   *
   * @param {(string | undefined)} [url=undefined]
   * @returns {string}
   */
  static getURI = (url: string | undefined = undefined): string => {
    const objURL = url === undefined ? this.getObjectURL() : new URL(url);
    return `${objURL.pathname}${objURL.search}`;
  };

  /**
   * Get the URL path from the current URL
   *
   * @param {string} url
   * @returns {string}
   */
  static getPathname = (url: string | undefined = undefined): string => {
    const objURL = url === undefined ? this.getObjectURL() : new URL(url);
    return `${objURL.pathname}`;
  };

  /**
   * Get the URL parameters from the current URL
   *
   * @returns {URLSearchParams}
   */
  static getURLParams = (): URLSearchParams => {
    const url = this.getObjectURL();
    return url.searchParams;
  };

  /**
   * Description placeholder
   *
   * @param {Array<URLParam>} queries
   */
  static urlPushState = (queries: Array<URLParam>): void => {
    let url = this.getObjectURL();
    url = this.deleteAllURLParams(url);
    window.history.pushState({}, '', this.generateURLWithParams(url.href, queries));
  };

  /**
   * @param {string} key
   * @param {string} value
   * @returns {URL}
   * @description Delete a URL parameter to the current URL
   */
  static deleteURLParams = (key: string): URL => {
    const url = this.getObjectURL();
    const params = url.searchParams;
    if (params.has(key)) {
      params.delete(key);
    }

    return url;
  };

  /**
   * @param {string} key
   * @param {string} value
   * @returns {URL}
   * @description Delete all URL parameters to the current URL
   */
  static deleteAllURLParams = (url: URL): URL => {
    const objURL = url ?? this.getObjectURL();
    const params = objURL.searchParams;
    for (const key of params.keys()) {
      params.delete(key);
    }

    return objURL;
  };

  /**
   * @param {string} url
   * @param {Array<URLParam>} queries
   * @returns {string}
   * @description Generate a URL with parameters
   */
  static generateURLWithParams = (url: string | undefined = undefined, queries: Array<URLParam>): string => {
    const objURL = url === undefined ? this.getObjectURL() : new URL(url);
    const params = objURL.searchParams;

    queries.forEach((query: URLParam) => {
      if (query.key !== '' && query.value !== '') {
        params.set(query.key, query.value);
      }
    });

    return objURL.href;
  };
}

interface DateOptions {
  year?: 'numeric' | '2-digit';
  month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
  day?: 'numeric' | '2-digit';
  hour?: 'numeric' | '2-digit';
  minute?: 'numeric' | '2-digit';
  second?: 'numeric' | '2-digit';
}
interface DateDiff {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

class DateFormatter {
  static LOCAL_TIMEZONE = 'Europe/Paris';

  /**
   * Return a full date formatted like `mercredi 2 avril 2025 à 23:29:37 UTC+2`
   * @param date
   * @returns {string}
   */
  static fullDate(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'full',
      timeStyle: 'long',
      timeZone: this.LOCAL_TIMEZONE,
    }).format(date);
  }

  /**
   * Returns a date formatted in the short format like `12/12/2023`
   * @param date
   * @returns
   */
  static shortDate(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'short',
      timeZone: this.LOCAL_TIMEZONE,
    }).format(date);
  }

  /**
   * Modify a date by adding or subtracting days, months, years, minutes or hours
   *
   * @static
   * @param {Date} date
   * @param {{ [key: string]: number }} options
   * @returns {Date}
   */
  static mofify(date: Date, options: { [key: string]: number }): Date {
    const newDate = new Date(date);

    if (options.days) {
      newDate.setDate(newDate.getDate() + options.days);
    }
    if (options.months) {
      newDate.setMonth(newDate.getMonth() + options.months);
    }
    if (options.years) {
      newDate.setFullYear(newDate.getFullYear() + options.years);
    }
    if (options.minutes) {
      newDate.setMinutes(newDate.getMinutes() + options.minutes);
    }
    if (options.hours) {
      newDate.setHours(newDate.getHours() + options.hours);
    }

    return newDate;
  }

  /**
   * If this function returns `true` the given date is in the past
   * @param date
   * @returns {boolean}
   */
  static isDateInPast(date: Date): boolean {
    const currentDate = new Date();
    return date < currentDate;
  }

  /**
   * Description placeholder
   *
   * @static
   * @param {Date} date1
   * @param {(Date | undefined)} [date2=undefined]
   * @returns {DateDiff}
   */
  static diff(date1: Date, date2: Date | undefined = undefined): DateDiff {
    if (date2 === undefined) {
      date2 = new Date();
    }

    let diff = Math.abs(date2.getTime() - date1.getTime());

    const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
    diff -= years * (1000 * 60 * 60 * 24 * 365);

    const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
    diff -= months * (1000 * 60 * 60 * 24 * 30);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -= days * (1000 * 60 * 60 * 24);

    const hours = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * (1000 * 60 * 60);

    const minutes = Math.floor(diff / (1000 * 60));
    diff -= minutes * (1000 * 60);

    const seconds = Math.floor(diff / 1000);

    return { years, months, days, hours, minutes, seconds };
  }
}

const fetchAPI = async <T>(url: string, options: RequestInit = {}): Promise<Response> => {
  try {
    const response = await fetch(url, options);
    // Vérifie si la réponse est OK (statut 200-299)
    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error; // Relance l'erreur pour que l'appelant puisse la gérer
  }
};

/**
 *
 * @async
 * @template T
 * @param {string} url
 * @param {RequestInit} [options={}]
 * @returns {Promise<T>}
 */
const fetchJSON = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  try {
    const response = await fetchAPI<T>(url, options);

    // Vérifie si la réponse est OK (statut 200-299)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Parse la réponse en JSON
    const data: T = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error; // Relance l'erreur pour que l'appelant puisse la gérer
  }
};

/**
 *
 * @async
 * @template T
 * @param {string} url
 * @param {RequestInit} [options={}]
 * @returns {Promise<string>}
 */
const fetchContent = async <T>(url: string, options: RequestInit = {}): Promise<string> => {
  try {
    const response = await fetchAPI<T>(url, options);

    // Vérifie si la réponse est OK (statut 200-299)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Récupère le contenu du fichier en tant que texte
    const fileContent: string = await response.text();
    return fileContent;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error; // Relance l'erreur pour que l'appelant puisse la gérer
  }
};

/**
 *
 * @async
 * @template T
 * @param {string} url
 * @param {RequestInit} [options={}]
 * @returns {Promise<Blob>}
 */
const fetchBlob = async <T>(url: string, options: RequestInit = {}): Promise<Blob> => {
  try {
    const response = await fetchAPI<T>(url, options);

    // Vérifie si la réponse est OK (statut 200-299)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Récupère le contenu du fichier en tant que texte
    const fileContent: Blob = await response.blob();
    return fileContent;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error; // Relance l'erreur pour que l'appelant puisse la gérer
  }
};

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
    return (Str.isJSON(value as string) ? JSON.parse(value as string) : value) as T;
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
    return (Str.isJSON(value as string) ? JSON.parse(value as string) : value) as T;
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

const BREAKPOINTS = {
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400,
};

type SnackBarStatus = 'success' | 'danger' | 'warning' | 'info' | 'primary';

type SnackBarTextColor = 'white' | 'dark';
interface SnackBarOptions {
  duration?: number;
  header?: string;
  autoHide?: boolean;
}

class SnackBar {
  content: HTMLDivElement | null = null;
  snackBar: HTMLDivElement | null = null;
  dismissButton = document.createElement('button');

  status: SnackBarStatus;
  message: string;
  options: SnackBarOptions;

  constructor(message: string, status: SnackBarStatus = 'info', options: SnackBarOptions) {
    this.message = message;
    this.status = this.getStatusMapping(status);
    this.options = options;
    this.setUpOptions();
    this.render();
  }

  setUpOptions() {
    const defaultOptions: SnackBarOptions = {
      duration: 10000,
      header: undefined,
      autoHide: true,
    };

    this.options = { ...defaultOptions, ...this.options };
  }

  getOptions() {
    return this.options;
  }

  getStatusMapping = (status: SnackBarStatus): SnackBarStatus => {
    const mapping = {
      success: 'success',
      danger: 'danger',
      warning: 'warning',
      info: 'primary',
      primary: 'primary',
    };

    return mapping[status] as SnackBarStatus;
  };

  getTextColor(): SnackBarTextColor {
    let color: SnackBarTextColor;

    switch (this.status) {
      case 'warning':
        color = 'dark';
        break;

      default:
        color = 'white';
        break;
    }

    return color;
  }

  setUpSnackbar() {
    this.snackBar = document.body.querySelector('.snackbar') as HTMLDivElement;
    if (this.snackBar === null || this.snackBar === undefined) {
      this.snackBar = document.createElement('div');
      this.snackBar.classList.add('snackbar');
    }
    document.body.insertAdjacentElement('beforeend', this.snackBar);
  }

  autoHide() {
    if (this.options.duration !== undefined) {
      setTimeout(() => this.content?.remove(), this.options.duration);
    }
  }

  setUpContent() {
    this.content = document.createElement('div');
    this.content.classList.add(
      'alert',
      'alert-dismissible',
      `bg-${this.status}`,
      `border-${this.status}`,
      `text-${this.getTextColor()}`,
      'shadow'
    );
    this.content.innerHTML = `
      ${this.message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    this.snackBar?.insertAdjacentElement('afterbegin', this.content);
  }

  render() {
    this.setUpSnackbar();
    this.setUpContent();
    if (this.options.autoHide) {
      this.autoHide();
    }
  }
}
