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
export {
  camelCase,
  capitalize,
  countOccurrences,
  decodeBase64,
  encodeBase64,
  isEmail,
  isEmpty,
  isJSON,
  isNumber,
  isURL,
  kebabCase,
  random,
  removeWhitespace,
  repeat,
  reverse,
  sanitize,
  slugify,
  snakeCase,
  truncate
};
