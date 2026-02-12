/**
 * Check if a user has a specific permission
 * @param {Object} user - The user object (must contain role_name)
 * @param {Array} userPermissions - Array of permission codes strings
 * @param {string} requiredPermission - The permission code to check
 * @returns {boolean}
 */
export function hasPermission(user, userPermissions, requiredPermission) {
  if (!user) return false;
  
  // SuperAdmin and Admin have all permissions
  if (['SuperAdmin', 'Admin'].includes(user.role_name)) {
    return true;
  }

  if (!userPermissions || linkDoNotAccess(userPermissions)) return false;

  // Check for wildcard permission
  if (userPermissions.includes('*')) return true;

  // Check for specific permission
  return userPermissions.includes(requiredPermission);
}

function linkDoNotAccess(permissions) {
    return !Array.isArray(permissions); 
}
