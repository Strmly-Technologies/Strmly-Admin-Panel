/**
 * Authentication utility functions for consistent auth handling
 */

/**
 * Get authorization headers for API requests
 * @returns {Object} Headers object with Content-Type and Authorization if token exists
 */
export const getAuthHeaders = () => {
  if (typeof window === 'undefined') {
    return { 'Content-Type': 'application/json' }; 
  }
  
  const token = localStorage.getItem('token');
  return { 
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if token exists in localStorage
 */
export const isAuthenticated = () => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('token');
};

/**
 * Logout user by removing token from localStorage
 * @param {function} router - Next.js router
 */
export const logout = (router) => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
  if (router) {
    router.push('/login');
  }
};

/**
 * Redirect to login if not authenticated
 * @param {function} router - Next.js router
 * @returns {boolean} - Whether redirect was performed
 */
export const redirectToLoginIfNeeded = (router) => {
  if (typeof window === 'undefined') return false;
  
  if (!isAuthenticated()) {
    const currentPath = window.location.pathname;
    const loginUrl = `/login${currentPath !== '/' ? `?redirect=${encodeURIComponent(currentPath)}` : ''}`;
    router.push(loginUrl);
    return true;
  }
  return false;
};

/**
 * Attach token to API request options
 * @param {Object} options - Fetch options
 * @returns {Object} - Options with authorization header
 */
export const withAuth = (options = {}) => {
  const headers = options.headers || {};
  return {
    ...options,
    headers: {
      ...headers,
      ...getAuthHeaders()
    }
  };
};
