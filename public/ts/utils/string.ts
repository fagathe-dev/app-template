const isJSON = (value: string): boolean => {
  try {
    JSON.parse(value);
    return true;
  } catch (error) {
    return false;
  }
};

const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const random = (length: number): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

const sanitize = (str: string): string => {
  // Normaliser la chaîne de caractères
  // Remplacer les caractères accentués par leur équivalent non accentué
  // Exemple : "é" devient "e", "ç" devient "c", etc.
  let chaine = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // Retirer les guillemets et les apostrophes
  chaine = chaine.replace(/[-"'"]/g, '');
  // Retirer les traits d'union et mettre en majuscules
  return chaine.replace(/-/g, '').toLowerCase();
};

const slugify = (str: string, separateur: string = '-'): string => {
  let chaine = sanitize(str);
  return chaine.split(' ').join(separateur);
};

const truncate = (str: string, length: number): string => {
  return str.length > length ? str.slice(0, length) + '...' : str;
};

const repeat = (str: string, times: number): string => {
  return new Array(times + 1).join(str);
};

const countOccurrences = (str: string, subStr: string): number => {
  return str.toLowerCase().split(subStr).length - 1;
};

const removeWhitespace = (str: string): string => {
  return str.replace(/\s+/g, '');
};

const camelCase = (str: string): string => {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => (index === 0 ? match.toLowerCase() : match.toUpperCase()))
    .replace(/\s+/g, '');
};

const snakeCase = (str: string): string => {
  return str.replace(/\s+/g, '_').toLowerCase();
};

const kebabCase = (str: string): string => {
  return str.replace(/\s+/g, '-').toLowerCase();
};

const encodeBase64 = (value: string): string => {
  return btoa(value);
};

const decodeBase64 = (value: string): string => {
  return atob(value);
};

const reverse = (str: string): string => {
  return str.split('').reverse().join('');
};

const isEmpty = (str: string): boolean => {
  return str.trim().length === 0;
};

const isURL = (value: string): boolean => {
  const regex = /^(ftp|http|https):\/\/[^ "]+$/;
  return regex.test(value);
};

const isNumber = (value: string): boolean => {
  return !isNaN(Number(value));
};

const isEmail = (value: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(value);
};

export {
  isJSON,
  capitalize,
  random,
  sanitize,
  slugify,
  truncate,
  repeat,
  countOccurrences,
  removeWhitespace,
  camelCase,
  snakeCase,
  kebabCase,
  encodeBase64,
  decodeBase64,
  reverse,
  isEmpty,
  isURL,
  isNumber,
  isEmail,
};
