import { URLParam } from '../types/url';

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

  static getAllURLParams = (url: string | undefined = undefined): Record<string, string> => {
    const objURL = url === undefined ? this.getObjectURL() : new URL(url);
    const params = objURL.searchParams;
    const queries: Record<string, string> = {};
    for (const [key, value] of params.entries()) {
      queries[key] = value;
    }
    return queries;
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

export { URLHandler };
