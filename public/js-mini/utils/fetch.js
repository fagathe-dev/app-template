// public/ts/utils/fetch.ts
var ApiError = class extends Error {
  constructor(status, statusText, message, response) {
    super(message);
    this.status = status;
    this.statusText = statusText;
    this.response = response;
    this.name = "ApiError";
  }
};
var fetchAPI = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        ...options.headers
      }
    });
    const clonedResponse = response.clone();
    const contentType = response.headers.get("content-type");
    let data;
    let text;
    let blob;
    text = await clonedResponse.text();
    try {
      data = contentType?.includes("application/json") ? JSON.parse(text) : {};
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
      blob
    };
    if (!response.ok) {
      throw new ApiError(
        response.status,
        response.statusText,
        typeof data === "object" && data && "message" in data ? String(data.message) : `Request failed with status ${response.status}`,
        response
      );
    }
    return fetchResponse;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      0,
      "Network Error",
      error instanceof Error ? error.message : "Unknown error occurred",
      new Response(null, { status: 0, statusText: "Network Error" })
    );
  }
};
export {
  ApiError,
  fetchAPI
};
