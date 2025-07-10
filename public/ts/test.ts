import test from 'node:test';
import { fetchAPI } from './utils/fetch';
import { capitalize } from './utils/string';


async function testFetch() {
  try {
    const response = await fetchAPI('/api/test', { method: 'GET' });
    console.log('Response:', response);
    if (response.ok) {
      const data = await response.json();
      console.log('Data:', data);
    } else {
      console.error('Fetch failed with status:', response.status);
    }
  } catch (error) {
    console.error('Error fetching API:', error);
  }
}

console.info(capitalize('hello world')); // Example usage of a utility function
testFetch();
