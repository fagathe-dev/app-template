/**
 * Interface representing the structure of API responses
 * @template T The type of data expected in the response
 */
interface FetchResponse<T> {
  ok: boolean;
  headers: Headers;
  status: number;
  statusText: string;
  data: T;
  text: string;
  blob: Blob;
}

/**
 * Custom error class for API request failures that implements most of FetchResponse properties
 * @template T The type of data expected in the error response
 */
class ApiError<T = unknown> extends Error {
  public readonly ok: boolean = false;
  public readonly headers: Headers;
  public readonly status: number;
  public readonly statusText: string;
  public readonly data: T;
  public readonly response: Response;

  constructor(status: number, statusText: string, message: string, response: Response, data?: T) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.response = response;
    this.headers = response.headers;
    this.data = data as T;
  }
}

/**
 * Enhanced fetch function for making API requests
 *
 * @template T The expected type of the response data
 * @param {string} url The URL to make the request to
 * @param {RequestInit} options Request options (method, headers, body, etc.)
 * @returns {Promise<FetchResponse<T>>} A promise that resolves to a typed response
 * @throws {ApiError} Throws when the request fails or returns a non-2xx status
 *
 * @example
 * // GET request example
 * try {
 *   const response = await fetchAPI<User[]>('/api/users');
 *   if (response.ok) {
 *     console.log(response.data); // typed as User[]
 *   }
 * } catch (error) {
 *   if (error instanceof ApiError) {
 *     console.error(`API Error: ${error.status} - ${error.message}`);
 *   }
 * }
 *
 * @example
 * // POST request example
 * try {
 *   const response = await fetchAPI<{ id: number }>('/api/users', {
 *     method: 'POST',
 *     body: { name: 'John Doe' },
 *   });
 *   if (response.ok) {
 *     console.log(`Created user with ID: ${response.data.id}`);
 *   }
 * } catch (error) {
 *   console.error('Failed to create user:', error);
 * }
 */
const fetchAPI = async <T>(url: string, options: RequestInit = {}): Promise<FetchResponse<T> | ApiError<T>> => {
  try {
    // Handle body serialization automatically
    const requestOptions = { ...options };

    if (
      requestOptions.body &&
      typeof requestOptions.body === 'object' &&
      !(requestOptions.body instanceof FormData) &&
      !(requestOptions.body instanceof URLSearchParams) &&
      !(requestOptions.body instanceof Blob) &&
      !(requestOptions.body instanceof ArrayBuffer) &&
      typeof requestOptions.body !== 'string'
    ) {
      requestOptions.body = JSON.stringify(requestOptions.body);
      // Set Content-Type to application/json if not already set
      requestOptions.headers = {
        'Content-Type': 'application/json',
        ...requestOptions.headers,
      };
    }

    const response = await fetch(url, {
      ...requestOptions,
      headers: {
        Accept: 'application/json',
        ...requestOptions.headers,
      },
    });

    // Clone the response so we can use it multiple times
    const clonedResponse = response.clone();

    // Prepare the response data based on content type
    const contentType = response.headers.get('content-type');
    let data: T;
    let text: string;
    let blob: Blob;

    // Get the text content first
    text = await clonedResponse.text();

    // Try to parse as JSON if the content type indicates JSON
    try {
      data = contentType?.includes('application/json') ? (JSON.parse(text) as T) : ({} as T);
    } catch (e) {
      data = {} as T;
    }

    // Get blob data
    blob = await response.clone().blob();

    // Create the response object
    const fetchResponse: FetchResponse<T> = {
      ok: response.ok,
      headers: response.headers,
      status: response.status,
      statusText: response.statusText,
      data,
      text,
      blob,
    };

    // If the response wasn't successful, throw an ApiError
    if (!response.ok) {
      throw new ApiError<T>(
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

    // Handle network errors or other failures
    const errorResponse = new Response(null, { status: 0, statusText: 'Network Error' });
    return new ApiError<T>(
      0,
      'Network Error',
      error instanceof Error ? error.message : 'Unknown error occurred',
      errorResponse,
      { message: 'Network Error' } as T
    );
  }
};

/**
 * HTTP GET request
 * @template T The expected type of the response data
 * @param {string} url The URL to make the request to
 * @param {Omit<RequestInit, 'method' | 'body'>} options Request options (headers, etc.)
 * @returns {Promise<FetchResponse<T>>} A promise that resolves to a typed response
 *
 * @example
 * const users = await fetchGET<User[]>('/api/users');
 * if (users.ok) {
 *   console.log(users.data); // typed as User[]
 * }
 */
const fetchGET = async <T>(
  url: string,
  options: Omit<RequestInit, 'method' | 'body'> = {}
): Promise<FetchResponse<T> | ApiError<T>> => {
  return fetchAPI<T>(url, { ...options, method: 'GET' });
};

/**
 * HTTP POST request
 * @template T The expected type of the response data
 * @param {string} url The URL to make the request to
 * @param {any} body The request body data
 * @param {Omit<RequestInit, 'method' | 'body'>} options Request options (headers, etc.)
 * @returns {Promise<FetchResponse<T>>} A promise that resolves to a typed response
 *
 * @example
 * const newUser = await fetchPOST<User>('/api/users', { name: 'John Doe', email: 'john@example.com' });
 * if (newUser.ok) {
 *   console.log('Created user:', newUser.data);
 * }
 */
const fetchPOST = async <T>(
  url: string,
  body?: any,
  options: Omit<RequestInit, 'method' | 'body'> = {}
): Promise<FetchResponse<T> | ApiError<T>> => {
  const requestOptions: RequestInit = {
    ...options,
    method: 'POST',
  };

  if (body !== undefined) {
    requestOptions.body = body;
  }

  return fetchAPI<T>(url, requestOptions);
};

/**
 * HTTP PUT request
 * @template T The expected type of the response data
 * @param {string} url The URL to make the request to
 * @param {any} body The request body data
 * @param {Omit<RequestInit, 'method' | 'body'>} options Request options (headers, etc.)
 * @returns {Promise<FetchResponse<T>>} A promise that resolves to a typed response
 *
 * @example
 * const updatedUser = await fetchPUT<User>('/api/users/1', { name: 'Jane Doe', email: 'jane@example.com' });
 * if (updatedUser.ok) {
 *   console.log('Updated user:', updatedUser.data);
 * }
 */
const fetchPUT = async <T>(
  url: string,
  body?: any,
  options: Omit<RequestInit, 'method' | 'body'> = {}
): Promise<FetchResponse<T> | ApiError<T>> => {
  const requestOptions: RequestInit = {
    ...options,
    method: 'PUT',
  };

  if (body !== undefined) {
    requestOptions.body = body;
  }

  return fetchAPI<T>(url, requestOptions);
};

/**
 * HTTP PATCH request
 * @template T The expected type of the response data
 * @param {string} url The URL to make the request to
 * @param {any} body The request body data (partial update)
 * @param {Omit<RequestInit, 'method' | 'body'>} options Request options (headers, etc.)
 * @returns {Promise<FetchResponse<T>>} A promise that resolves to a typed response
 *
 * @example
 * const patchedUser = await fetchPATCH<User>('/api/users/1', { email: 'newemail@example.com' });
 * if (patchedUser.ok) {
 *   console.log('Patched user:', patchedUser.data);
 * }
 */
const fetchPATCH = async <T>(
  url: string,
  body?: any,
  options: Omit<RequestInit, 'method' | 'body'> = {}
): Promise<FetchResponse<T> | ApiError<T>> => {
  const requestOptions: RequestInit = {
    ...options,
    method: 'PATCH',
  };

  if (body !== undefined) {
    requestOptions.body = body;
  }

  return fetchAPI<T>(url, requestOptions);
};

/**
 * HTTP DELETE request
 * @template T The expected type of the response data
 * @param {string} url The URL to make the request to
 * @param {Omit<RequestInit, 'method' | 'body'>} options Request options (headers, etc.)
 * @returns {Promise<FetchResponse<T>>} A promise that resolves to a typed response
 *
 * @example
 * const result = await fetchDELETE<{ success: boolean }>('/api/users/1');
 * if (result.ok) {
 *   console.log('User deleted successfully:', result.data);
 * }
 */
const fetchDELETE = async <T>(
  url: string,
  options: Omit<RequestInit, 'method' | 'body'> = {}
): Promise<FetchResponse<T> | ApiError<T>> => {
  return fetchAPI<T>(url, { ...options, method: 'DELETE' });
};

export { fetchAPI, fetchGET, fetchPOST, fetchPUT, fetchPATCH, fetchDELETE, FetchResponse, ApiError };
