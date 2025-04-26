var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a;
const $ = (selector) => {
    const elements = document.querySelectorAll(selector);
    if (elements.length === 0) {
        return null;
    }
    if (elements.length === 1) {
        return elements[0];
    }
    return elements;
};
class Str {
    static isJSON(value) {
        try {
            JSON.parse(value);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    static capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
    static random(length) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }
    static slugify(str, separateur = '-') {
        let chaine = this.sanitize(str);
        return chaine.split(' ').join(separateur);
    }
    static truncate(str, length) {
        return str.length > length ? str.slice(0, length) + '...' : str;
    }
    static repeat(str, times) {
        return new Array(times + 1).join(str);
    }
    static countOccurrences(str, subStr) {
        return str.toLowerCase().split(subStr).length - 1;
    }
    static removeWhitespace(str) {
        return str.replace(/\s+/g, '');
    }
    static camelCase(str) {
        return str
            .replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => (index === 0 ? match.toLowerCase() : match.toUpperCase()))
            .replace(/\s+/g, '');
    }
    static snakeCase(str) {
        return str.replace(/\s+/g, '_').toLowerCase();
    }
    static kebabCase(str) {
        return str.replace(/\s+/g, '-').toLowerCase();
    }
    static encodeBase64(value) {
        return btoa(value);
    }
    static decodeBase64(value) {
        return atob(value);
    }
    static reverse(str) {
        return str.split('').reverse().join('');
    }
    static isEmpty(str) {
        return str.trim().length === 0;
    }
    static isURL(value) {
        const regex = /^(ftp|http|https):\/\/[^ "]+$/;
        return regex.test(value);
    }
    static isNumber(value) {
        return !isNaN(Number(value));
    }
    static isEmail(value) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(value);
    }
}
Str.sanitize = (str) => {
    // Normaliser la chaîne de caractères
    // Remplacer les caractères accentués par leur équivalent non accentué
    // Exemple : "é" devient "e", "ç" devient "c", etc.
    let chaine = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    // Retirer les guillemets et les apostrophes
    chaine = chaine.replace(/[-"'"]/g, '');
    // Retirer les traits d'union et mettre en majuscules
    return chaine.replace(/-/g, '').toLowerCase();
};
class URLHandler {
}
_a = URLHandler;
/**
 * @description Get the current URL as an URL object
 * @returns {URL}
 */
URLHandler.getObjectURL = () => {
    const url = window.location.href;
    return new URL(url);
};
/**
 * Get the URL base from the current URL or from a given URL
 *
 * @param {string} url
 * @returns {string}
 */
URLHandler.getBaseURL = (url = undefined) => url === undefined ? window.location.origin : new URL(url).origin;
/**
 * @description Get the URI path from the current URL or from a given URL
 *
 * @param {(string | undefined)} [url=undefined]
 * @returns {string}
 */
URLHandler.getURI = (url = undefined) => {
    const objURL = url === undefined ? _a.getObjectURL() : new URL(url);
    return `${objURL.pathname}${objURL.search}`;
};
/**
 * Get the URL path from the current URL
 *
 * @param {string} url
 * @returns {string}
 */
URLHandler.getPathname = (url = undefined) => {
    const objURL = url === undefined ? _a.getObjectURL() : new URL(url);
    return `${objURL.pathname}`;
};
/**
 * Get the URL parameters from the current URL
 *
 * @returns {URLSearchParams}
 */
URLHandler.getURLParams = () => {
    const url = _a.getObjectURL();
    return url.searchParams;
};
/**
 * Description placeholder
 *
 * @param {Array<URLParam>} queries
 */
URLHandler.urlPushState = (queries) => {
    let url = _a.getObjectURL();
    url = _a.deleteAllURLParams(url);
    window.history.pushState({}, '', _a.generateURLWithParams(url.href, queries));
};
/**
 * @param {string} key
 * @param {string} value
 * @returns {URL}
 * @description Delete a URL parameter to the current URL
 */
URLHandler.deleteURLParams = (key) => {
    const url = _a.getObjectURL();
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
URLHandler.deleteAllURLParams = (url) => {
    const objURL = url !== null && url !== void 0 ? url : _a.getObjectURL();
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
URLHandler.generateURLWithParams = (url = undefined, queries) => {
    const objURL = url === undefined ? _a.getObjectURL() : new URL(url);
    const params = objURL.searchParams;
    queries.forEach((query) => {
        if (query.key !== '' && query.value !== '') {
            params.set(query.key, query.value);
        }
    });
    return objURL.href;
};
class DateFormatter {
    /**
     * Return a full date formatted like `mercredi 2 avril 2025 à 23:29:37 UTC+2`
     * @param date
     * @returns {string}
     */
    static fullDate(date) {
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
    static shortDate(date) {
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
    static mofify(date, options) {
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
    static isDateInPast(date) {
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
    static diff(date1, date2 = undefined) {
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
DateFormatter.LOCAL_TIMEZONE = 'Europe/Paris';
const fetchAPI = (url_1, ...args_1) => __awaiter(this, [url_1, ...args_1], void 0, function* (url, options = {}) {
    try {
        const response = yield fetch(url, options);
        // Vérifie si la réponse est OK (statut 200-299)
        return response;
    }
    catch (error) {
        console.error('Fetch error:', error);
        throw error; // Relance l'erreur pour que l'appelant puisse la gérer
    }
});
/**
 *
 * @async
 * @template T
 * @param {string} url
 * @param {RequestInit} [options={}]
 * @returns {Promise<T>}
 */
const fetchJSON = (url_1, ...args_1) => __awaiter(this, [url_1, ...args_1], void 0, function* (url, options = {}) {
    try {
        const response = yield fetchAPI(url, options);
        // Vérifie si la réponse est OK (statut 200-299)
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        // Parse la réponse en JSON
        const data = yield response.json();
        return data;
    }
    catch (error) {
        console.error('Fetch error:', error);
        throw error; // Relance l'erreur pour que l'appelant puisse la gérer
    }
});
/**
 *
 * @async
 * @template T
 * @param {string} url
 * @param {RequestInit} [options={}]
 * @returns {Promise<string>}
 */
const fetchContent = (url_1, ...args_1) => __awaiter(this, [url_1, ...args_1], void 0, function* (url, options = {}) {
    try {
        const response = yield fetchAPI(url, options);
        // Vérifie si la réponse est OK (statut 200-299)
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        // Récupère le contenu du fichier en tant que texte
        const fileContent = yield response.text();
        return fileContent;
    }
    catch (error) {
        console.error('Fetch error:', error);
        throw error; // Relance l'erreur pour que l'appelant puisse la gérer
    }
});
/**
 *
 * @async
 * @template T
 * @param {string} url
 * @param {RequestInit} [options={}]
 * @returns {Promise<Blob>}
 */
const fetchBlob = (url_1, ...args_1) => __awaiter(this, [url_1, ...args_1], void 0, function* (url, options = {}) {
    try {
        const response = yield fetchAPI(url, options);
        // Vérifie si la réponse est OK (statut 200-299)
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        // Récupère le contenu du fichier en tant que texte
        const fileContent = yield response.blob();
        return fileContent;
    }
    catch (error) {
        console.error('Fetch error:', error);
        throw error; // Relance l'erreur pour que l'appelant puisse la gérer
    }
});
class LocalStorageHandler {
    static all() {
        const items = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                const value = localStorage.getItem(key);
                items[key] = this.getValue(value);
            }
        }
        return items;
    }
    static getValue(value) {
        return (Str.isJSON(value) ? JSON.parse(value) : value);
    }
    static get(key, defaultValue = null) {
        const value = localStorage.getItem(key);
        if (value === null) {
            return defaultValue;
        }
        return this.getValue(value);
    }
    static remove(key) {
        if (!this.has(key)) {
            return false;
        }
        localStorage.removeItem(key);
    }
    static clear() {
        localStorage.clear();
    }
    static has(key) {
        const items = this.all();
        return Object.keys(items).includes(key);
    }
    static keys(key) {
        const items = this.all();
        return Object.keys(items);
    }
    static values(key) {
        const items = this.all();
        return Object.values(items);
    }
    static set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }
}
class SessionStorageHandler {
    static all() {
        const items = {};
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key) {
                const value = sessionStorage.getItem(key);
                items[key] = this.getValue(value);
            }
        }
        return items;
    }
    static getValue(value) {
        return (Str.isJSON(value) ? JSON.parse(value) : value);
    }
    static get(key, defaultValue = null) {
        const value = sessionStorage.getItem(key);
        if (value === null) {
            return defaultValue;
        }
        return this.getValue(value);
    }
    static remove(key) {
        if (!this.has(key)) {
            return false;
        }
        sessionStorage.removeItem(key);
    }
    static clear() {
        sessionStorage.clear();
    }
    static has(key) {
        const items = this.all();
        return Object.keys(items).includes(key);
    }
    static keys(key) {
        const items = this.all();
        return Object.keys(items);
    }
    static values(key) {
        const items = this.all();
        return Object.values(items);
    }
    static set(key, value) {
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
class SnackBar {
    constructor(message, status = 'info', options) {
        this.content = null;
        this.snackBar = null;
        this.dismissButton = document.createElement('button');
        this.getStatusMapping = (status) => {
            const mapping = {
                success: 'success',
                danger: 'danger',
                warning: 'warning',
                info: 'primary',
                primary: 'primary',
            };
            return mapping[status];
        };
        this.message = message;
        this.status = this.getStatusMapping(status);
        this.options = options;
        this.setUpOptions();
        this.render();
    }
    setUpOptions() {
        const defaultOptions = {
            duration: 10000,
            header: undefined,
            autoHide: true,
        };
        this.options = Object.assign(Object.assign({}, defaultOptions), this.options);
    }
    getOptions() {
        return this.options;
    }
    getTextColor() {
        let color;
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
        this.snackBar = document.body.querySelector('.snackbar');
        if (this.snackBar === null || this.snackBar === undefined) {
            this.snackBar = document.createElement('div');
            this.snackBar.classList.add('snackbar');
        }
        document.body.insertAdjacentElement('beforeend', this.snackBar);
    }
    autoHide() {
        if (this.options.duration !== undefined) {
            setTimeout(() => { var _b; return (_b = this.content) === null || _b === void 0 ? void 0 : _b.remove(); }, this.options.duration);
        }
    }
    setUpContent() {
        var _b;
        this.content = document.createElement('div');
        this.content.classList.add('alert', 'alert-dismissible', `bg-${this.status}`, `border-${this.status}`, `text-${this.getTextColor()}`, 'shadow');
        this.content.innerHTML = `
      ${this.message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
        (_b = this.snackBar) === null || _b === void 0 ? void 0 : _b.insertAdjacentElement('afterbegin', this.content);
    }
    render() {
        this.setUpSnackbar();
        this.setUpContent();
        if (this.options.autoHide) {
            this.autoHide();
        }
    }
}
