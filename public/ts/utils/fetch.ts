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
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ name: 'John Doe' }),
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
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...options.headers,
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

    console.log('ICI');

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

export { fetchAPI, FetchResponse, ApiError };
