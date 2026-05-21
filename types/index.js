/**
 * Data structure definitions
 * These are just for reference; using plain JS objects
 */

/**
 * @typedef {Object} Client
 * @property {string} id - Unique identifier
 * @property {string} name - Full name
 * @property {string} dob - Date of birth (YYYY-MM-DD)
 * @property {string} email - Email address
 * @property {string} mobileNumber - Mobile phone number
 * @property {string} createdAt - ISO date string
 * @property {string[]} reviews - Array of review IDs
 */

/**
 * @typedef {Object} Review
 * @property {string} id - Unique identifier
 * @property {string} clientId - Parent client ID
 * @property {string} reviewName - Name/title of review
 * @property {string} createdAt - ISO date string
 * @property {string} status - 'not_started' | 'extracted'
 * @property {HoldingsSet[]} holdingsSets - Array of holdings sets (one per portfolio/screenshot)
 */

/**
 * @typedef {Object} HoldingsSet
 * @property {string} id - Unique identifier
 * @property {string} name - Portfolio name (e.g., HSBC, AIA, Manulife)
 * @property {Holding[]} holdings - Array of holdings in this portfolio
 * @property {number} totalPortfolioValueSgd - Total value of this portfolio in SGD
 */

/**
 * @typedef {Object} Holding
 * @property {string} id - Unique identifier
 * @property {string} fundName - Name of fund/security
 * @property {number} units - Number of units held
 * @property {number} unitPrice - Price per unit
 * @property {string} currency - Currency code (SGD, USD, etc.)
 * @property {number} fxRateToSgd - Exchange rate to SGD
 * @property {number} marketValueOriginal - Value in original currency
 * @property {number} marketValueSgd - Value in SGD
 * @property {number} weightagePercent - % of total portfolio
 */

export const ClientType = {};
export const ReviewType = {};
export const HoldingType = {};
