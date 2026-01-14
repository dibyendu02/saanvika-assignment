/**
 * Pagination Utility
 * Reusable pagination helper for all list endpoints
 */

/**
 * Default pagination values
 */
const DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100,
};

/**
 * Parse and validate pagination parameters
 * @param {Object} params - Raw pagination params { page, limit }
 * @returns {Object} - Validated { page, limit, skip }
 */
export const parsePagination = (params = {}) => {
  let page = parseInt(params.page, 10);
  let limit = parseInt(params.limit, 10);

  // Apply defaults if invalid
  if (isNaN(page) || page < 1) {
    page = DEFAULTS.PAGE;
  }

  if (isNaN(limit) || limit < 1) {
    limit = DEFAULTS.LIMIT;
  }

  // Cap limit to prevent excessive queries
  if (limit > DEFAULTS.MAX_LIMIT) {
    limit = DEFAULTS.MAX_LIMIT;
  }

  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Build pagination metadata from results
 * @param {number} total - Total count of documents
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @returns {Object} - Pagination metadata
 */
export const buildPaginationMeta = (total, page, limit) => {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

/**
 * Build search query for text fields
 * @param {string} search - Search term
 * @param {string[]} fields - Fields to search in
 * @returns {Object|null} - MongoDB $or query or null if no search
 */
export const buildSearchQuery = (search, fields = []) => {
  if (!search || !search.trim() || fields.length === 0) {
    return null;
  }

  const searchTerm = search.trim();
  const searchRegex = { $regex: searchTerm, $options: 'i' };

  return {
    $or: fields.map((field) => ({ [field]: searchRegex })),
  };
};

/**
 * Merge search query into existing query
 * @param {Object} query - Existing MongoDB query
 * @param {Object|null} searchQuery - Search query from buildSearchQuery
 * @returns {Object} - Merged query
 */
export const mergeSearchQuery = (query, searchQuery) => {
  if (!searchQuery) {
    return query;
  }

  // If query already has $and or we need to combine with existing conditions
  if (Object.keys(query).length === 0) {
    return searchQuery;
  }

  return {
    $and: [query, searchQuery],
  };
};

export default {
  parsePagination,
  buildPaginationMeta,
  buildSearchQuery,
  mergeSearchQuery,
  DEFAULTS,
};
