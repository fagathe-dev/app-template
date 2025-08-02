var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) =>
  key in obj
    ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value })
    : (obj[key] = value);
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== 'symbol' ? key + '' : key, value);

// public/ts/utils/fetch.ts
var ApiError = class extends Error {
  constructor(status, statusText, message, response, data) {
    super(message);
    __publicField(this, 'ok', false);
    __publicField(this, 'headers');
    __publicField(this, 'status');
    __publicField(this, 'statusText');
    __publicField(this, 'data');
    __publicField(this, 'response');
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.response = response;
    this.headers = response.headers;
    this.data = data;
  }
};
var fetchAPI = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...options.headers,
      },
    });
    const clonedResponse = response.clone();
    const contentType = response.headers.get('content-type');
    let data;
    let text;
    let blob;
    text = await clonedResponse.text();
    try {
      data = contentType?.includes('application/json') ? JSON.parse(text) : {};
    } catch (e) {
      data = {};
    }
    blob = await response.clone().blob();
    const fetchResponse = {
      ok: response.ok,
      headers: response.headers,
      status: response.status,
      statusText: response.statusText,
      data,
      text,
      blob,
    };
    if (!response.ok) {
      throw new ApiError(
        response.status,
        response.statusText,
        typeof data === 'object' && data && 'message' in data
          ? String(data.message)
          : `Request failed with status ${response.status}`,
        response,
        data
      );
    }
    return fetchResponse;
  } catch (error) {
    if (error instanceof ApiError) {
      console.warn('throw ERROR');
      console.log(error);
      return error;
    }
    console.log('ICI');
    const errorResponse = new Response(null, { status: 0, statusText: 'Network Error' });
    return new ApiError(
      0,
      'Network Error',
      error instanceof Error ? error.message : 'Unknown error occurred',
      errorResponse,
      { message: 'Network Error' }
    );
  }
};
export { ApiError, fetchAPI };
