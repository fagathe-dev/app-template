var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// public/ts/utils/url.ts
var _URLHandler = class _URLHandler {
};
/**
 * @description Get the current URL as an URL object
 * @returns {URL}
 */
__publicField(_URLHandler, "getObjectURL", () => {
  const url = window.location.href;
  return new URL(url);
});
/**
 * Get the URL base from the current URL or from a given URL
 *
 * @param {string} url
 * @returns {string}
 */
__publicField(_URLHandler, "getBaseURL", (url = void 0) => url === void 0 ? window.location.origin : new URL(url).origin);
/**
 * @description Get the URI path from the current URL or from a given URL
 *
 * @param {(string | undefined)} [url=undefined]
 * @returns {string}
 */
__publicField(_URLHandler, "getURI", (url = void 0) => {
  const objURL = url === void 0 ? _URLHandler.getObjectURL() : new URL(url);
  return `${objURL.pathname}${objURL.search}`;
});
/**
 * Get the URL path from the current URL
 *
 * @param {string} url
 * @returns {string}
 */
__publicField(_URLHandler, "getPathname", (url = void 0) => {
  const objURL = url === void 0 ? _URLHandler.getObjectURL() : new URL(url);
  return `${objURL.pathname}`;
});
/**
 * Get the URL parameters from the current URL
 *
 * @returns {URLSearchParams}
 */
__publicField(_URLHandler, "getURLParams", () => {
  const url = _URLHandler.getObjectURL();
  return url.searchParams;
});
__publicField(_URLHandler, "getAllURLParams", (url = void 0) => {
  const objURL = url === void 0 ? _URLHandler.getObjectURL() : new URL(url);
  const params = objURL.searchParams;
  const queries = {};
  for (const [key, value] of params.entries()) {
    queries[key] = value;
  }
  return queries;
});
/**
 * Description placeholder
 *
 * @param {Array<URLParam>} queries
 */
__publicField(_URLHandler, "urlPushState", (queries) => {
  let url = _URLHandler.getObjectURL();
  url = _URLHandler.deleteAllURLParams(url);
  window.history.pushState({}, "", _URLHandler.generateURLWithParams(url.href, queries));
});
/**
 * @param {string} key
 * @param {string} value
 * @returns {URL}
 * @description Delete a URL parameter to the current URL
 */
__publicField(_URLHandler, "deleteURLParams", (key) => {
  const url = _URLHandler.getObjectURL();
  const params = url.searchParams;
  if (params.has(key)) {
    params.delete(key);
  }
  return url;
});
/**
 * @param {string} key
 * @param {string} value
 * @returns {URL}
 * @description Delete all URL parameters to the current URL
 */
__publicField(_URLHandler, "deleteAllURLParams", (url) => {
  const objURL = url ?? _URLHandler.getObjectURL();
  const params = objURL.searchParams;
  for (const key of params.keys()) {
    params.delete(key);
  }
  return objURL;
});
/**
 * @param {string} url
 * @param {Array<URLParam>} queries
 * @returns {string}
 * @description Generate a URL with parameters
 */
__publicField(_URLHandler, "generateURLWithParams", (url = void 0, queries) => {
  const objURL = url === void 0 ? _URLHandler.getObjectURL() : new URL(url);
  const params = objURL.searchParams;
  queries.forEach((query) => {
    if (query.key !== "" && query.value !== "") {
      params.set(query.key, query.value);
    }
  });
  return objURL.href;
});
var URLHandler = _URLHandler;
export {
  URLHandler
};
