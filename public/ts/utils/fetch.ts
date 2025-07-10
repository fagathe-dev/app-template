const fetchAPI = async <T>(url: string, options: RequestInit = {}): Promise<Response> => {
  try {
    const response = await fetch(url, options);
    // Vérifie si la réponse est OK (statut 200-299)
    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error; // Relance l'erreur pour que l'appelant puisse la gérer
  }
};

/**
 *
 * @async
 * @template T
 * @param {string} url
 * @param {RequestInit} [options={}]
 * @returns {Promise<T>}
 */
const fetchJSON = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  try {
    const response = await fetchAPI<T>(url, options);

    // Vérifie si la réponse est OK (statut 200-299)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Parse la réponse en JSON
    const data: T = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error; // Relance l'erreur pour que l'appelant puisse la gérer
  }
};

/**
 *
 * @async
 * @template T
 * @param {string} url
 * @param {RequestInit} [options={}]
 * @returns {Promise<string>}
 */
const fetchContent = async <T>(url: string, options: RequestInit = {}): Promise<string> => {
  try {
    const response = await fetchAPI<T>(url, options);

    // Vérifie si la réponse est OK (statut 200-299)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Récupère le contenu du fichier en tant que texte
    const fileContent: string = await response.text();
    return fileContent;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error; // Relance l'erreur pour que l'appelant puisse la gérer
  }
};

/**
 *
 * @async
 * @template T
 * @param {string} url
 * @param {RequestInit} [options={}]
 * @returns {Promise<Blob>}
 */
const fetchBlob = async <T>(url: string, options: RequestInit = {}): Promise<Blob> => {
  try {
    const response = await fetchAPI<T>(url, options);

    // Vérifie si la réponse est OK (statut 200-299)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Récupère le contenu du fichier en tant que texte
    const fileContent: Blob = await response.blob();
    return fileContent;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error; // Relance l'erreur pour que l'appelant puisse la gérer
  }
};

export { fetchAPI, fetchJSON, fetchContent, fetchBlob };
