/**
 * Extraction Service (Frontend)
 * Calls the /api/extract or /api/extract-csv to extract portfolio data
 * Works with both images and CSV files
 */

/**
 * Extract portfolio holdings from a CSV file
 * @param {File} csvFile - CSV file from file input
 * @returns {Promise<Array>} Array of holding objects
 */
export const extractPortfolioFromCSV = async (csvFile) => {
  console.log('[EXTRACTION_SERVICE] Sending CSV to API:', csvFile.name);

  try {
    const formData = new FormData();
    formData.append('file', csvFile);

    console.log('[EXTRACTION_SERVICE] Calling /api/extract-csv');

    const response = await fetch('/api/extract-csv', {
      method: 'POST',
      body: formData,
    });

    console.log('[EXTRACTION_SERVICE] Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('[EXTRACTION_SERVICE] Got response with', data.holdings.length, 'holdings');

    return data.holdings;
  } catch (error) {
    console.error('[EXTRACTION_SERVICE] Error:', error.message);
    throw new Error(`Failed to extract portfolio from CSV: ${error.message}`);
  }
};

/**
 * Extract portfolio holdings from an image by calling the API
 * @param {File} imageFile - Image file from file input
 * @returns {Promise<Array>} Array of holding objects
 */
export const extractPortfolioFromImage = async (imageFile) => {
  console.log('[EXTRACTION_SERVICE] Sending image to API:', imageFile.name);

  try {
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', imageFile);

    console.log('[EXTRACTION_SERVICE] Calling /api/extract');

    // Call local API route (works on localhost:3000 or Vercel)
    const response = await fetch('/api/extract', {
      method: 'POST',
      body: formData,
    });

    console.log('[EXTRACTION_SERVICE] Response status:', response.status);

    // Check for errors
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    // Parse response
    const data = await response.json();
    console.log('[EXTRACTION_SERVICE] Got response with', data.holdings.length, 'holdings');

    // Return holdings
    return data.holdings;
  } catch (error) {
    console.error('[EXTRACTION_SERVICE] Error:', error.message);
    throw new Error(`Failed to extract portfolio: ${error.message}`);
  }
};
