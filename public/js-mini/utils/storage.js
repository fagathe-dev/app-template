// public/ts/utils/string.ts
var isJSON = (value) => {
  try {
    JSON.parse(value);
    return true;
  } catch (error) {
    return false;
  }
};
var capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};
var random = (length) => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};
var sanitize = (str) => {
  let chaine = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  chaine = chaine.replace(/[-"'"]/g, "");
  return chaine.replace(/-/g, "").toLowerCase();
};
var slugify = (str, separateur = "-") => {
  let chaine = sanitize(str);
  return chaine.split(" ").join(separateur);
};
var truncate = (str, length) => {
  return str.length > length ? str.slice(0, length) + "..." : str;
};
var repeat = (str, times) => {
  return new Array(times + 1).join(str);
};
var countOccurrences = (str, subStr) => {
  return str.toLowerCase().split(subStr).length - 1;
};
var removeWhitespace = (str) => {
  return str.replace(/\s+/g, "");
};
var camelCase = (str) => {
  return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => index === 0 ? match.toLowerCase() : match.toUpperCase()).replace(/\s+/g, "");
};
var snakeCase = (str) => {
  return str.replace(/\s+/g, "_").toLowerCase();
};
var kebabCase = (str) => {
  return str.replace(/\s+/g, "-").toLowerCase();
};
var encodeBase64 = (value) => {
  return btoa(value);
};
var decodeBase64 = (value) => {
  return atob(value);
};
var reverse = (str) => {
  return str.split("").reverse().join("");
};
var isEmpty = (str) => {
  return str.trim().length === 0;
};
var isURL = (value) => {
  const regex = /^(ftp|http|https):\/\/[^ "]+$/;
  return regex.test(value);
};
var isNumber = (value) => {
  return !isNaN(Number(value));
};
var isEmail = (value) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(value);
};

// public/ts/utils/storage.ts
var LocalStorageHandler = class {
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
    return isJSON(value) ? JSON.parse(value) : value;
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
};
var SessionStorageHandler = class {
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
    return isJSON(value) ? JSON.parse(value) : value;
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
};
export {
  LocalStorageHandler,
  SessionStorageHandler
};
