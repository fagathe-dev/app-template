// public/ts/utils/fetch.ts
var fetchAPI = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
};
var fetchJSON = async (url, options = {}) => {
  try {
    const response = await fetchAPI(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
};
var fetchContent = async (url, options = {}) => {
  try {
    const response = await fetchAPI(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const fileContent = await response.text();
    return fileContent;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
};
var fetchBlob = async (url, options = {}) => {
  try {
    const response = await fetchAPI(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const fileContent = await response.blob();
    return fileContent;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
};
export {
  fetchAPI,
  fetchBlob,
  fetchContent,
  fetchJSON
};
