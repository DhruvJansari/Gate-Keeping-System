/**
 * Permission-based utilities for step-wise dashboard
 * Maps user permissions to workflow steps and actions
 */

// Permission codes (must match database)
export const PERMISSIONS = {
  // Transaction management
  CREATE_TRANSACTIONS: 'create_transactions',
  EDIT_TRANSACTIONS: 'edit_transactions',
  VIEW_TRANSACTIONS: 'view_transactions',
  CONFIRM_STAGES: 'confirm_stages',
  
  // Weighbridge
  WEIGHBRIDGE_ACCESS: 'weighbridge_access',
  ADD_WEIGHT_ENTRIES: 'add_weight_entries',
  
  // Masters
  MANAGE_MASTERS: 'manage_masters',
  VIEW_MASTERS: 'view_masters',
  
  // Reports & exports
  VIEW_REPORTS: 'view_reports',
  EXPORT_DATA: 'export_data',
  
  // User management
  MANAGE_USERS: 'manage_users',
  MANAGE_ROLES: 'manage_roles',
  
  // Admin wildcard (not in DB, but used for checks)
  ALL_PERMISSIONS: '*'
};

// Workflow steps
export const STEPS = {
  GATE: 1,      // Parking, Gate In, Gate Out
  WEIGHBRIDGE: 2, // First Weigh, Second Weigh, Gate Pass
  YARD: 3       // Campus In, Campus Out
};

/**
 * Determine which workflow steps a user can operate on
 * @param {string[]} permissions - Array of permission codes
 * @returns {number[]} Array of step numbers [1, 2, 3]
 */
// [REFINED] Determine steps based on exclusive permission sets
export function determineUserSteps(permissions) {
  if (!permissions || permissions.length === 0) return [];
  
  if (permissions.includes(PERMISSIONS.ALL_PERMISSIONS)) {
    return [STEPS.GATE, STEPS.WEIGHBRIDGE, STEPS.YARD];
  }

  const steps = [];
  const hasCreate = permissions.includes(PERMISSIONS.CREATE_TRANSACTIONS);
  const hasWeigh = permissions.includes(PERMISSIONS.WEIGHBRIDGE_ACCESS) || permissions.includes(PERMISSIONS.ADD_WEIGHT_ENTRIES);
  const hasConfirm = permissions.includes(PERMISSIONS.CONFIRM_STAGES);

  // 1. GATE: Requires Create Transaction permission
  // (Gatekeepers create entries. Parking/Gate In/Out are their domain)
  if (hasCreate) {
    steps.push(STEPS.GATE);
  }

  // 2. WEIGHBRIDGE: Requires Weighbridge Access
  // (Weighbridge operators manage weight steps)
  if (hasWeigh) {
    steps.push(STEPS.WEIGHBRIDGE);
  }

  // 3. YARD: Requires Confirm Stages BUT NOT Create or Weighbridge
  // (Yard operators only confirm movements, don't create or weigh)
  if (hasConfirm && !hasCreate && !hasWeigh) {
    steps.push(STEPS.YARD);
  }
  
  return steps;
}

/**
 * Check if user can access a specific step
 * @param {string[]} permissions
 * @param {number} step - Step number (1, 2, or 3)
 * @returns {boolean}
 */
export function canAccessStep(permissions, step) {
  const userSteps = determineUserSteps(permissions);
  return userSteps.includes(step);
}

/**
 * Check if user can perform a specific action
 * @param {string[]} permissions
 * @param {string} action - Action name
 * @returns {boolean}
 */
export function canPerformAction(permissions, action) {
  if (!permissions) return false;
  if (permissions.includes(PERMISSIONS.ALL_PERMISSIONS)) return true;
  
  const actionMap = {
    // Transaction actions
    'create_transaction': PERMISSIONS.CREATE_TRANSACTIONS,
    'edit_transaction': PERMISSIONS.EDIT_TRANSACTIONS,
    'delete_transaction': PERMISSIONS.EDIT_TRANSACTIONS, // Deletion requires edit permission
    
    // Stage confirmations
    'confirm_parking': PERMISSIONS.CONFIRM_STAGES,
    'confirm_gate_in': PERMISSIONS.CONFIRM_STAGES,
    'confirm_gate_out': PERMISSIONS.CONFIRM_STAGES,
    'confirm_campus_in': PERMISSIONS.CONFIRM_STAGES,
    'confirm_campus_out': PERMISSIONS.CONFIRM_STAGES,
    
    // Weighbridge
    'add_first_weight': PERMISSIONS.ADD_WEIGHT_ENTRIES,
    'add_second_weight': PERMISSIONS.ADD_WEIGHT_ENTRIES,
    'finalize_gate_pass': PERMISSIONS.WEIGHBRIDGE_ACCESS,
    
    // Masters
    'manage_parties': PERMISSIONS.MANAGE_MASTERS,
    'manage_items': PERMISSIONS.MANAGE_MASTERS,
    'manage_transporters': PERMISSIONS.MANAGE_MASTERS,
    
    // Reports
    'view_reports': PERMISSIONS.VIEW_REPORTS,
    'export_data': PERMISSIONS.EXPORT_DATA,
    
    // Users
    'manage_users': PERMISSIONS.MANAGE_USERS,
    'manage_roles': PERMISSIONS.MANAGE_ROLES,
  };
  
  const requiredPermission = actionMap[action];
  return requiredPermission && permissions.includes(requiredPermission);
}

/**
 * Get visible table columns based on user steps
 * @param {number[]} userSteps
 * @returns {string[]} Array of column keys
 */
export function getVisibleColumns(userSteps) {
  const columns = ['product', 'vehicle', 'vendor', 'actions'];
  
  if (userSteps.includes(STEPS.GATE)) {
    columns.push('parking', 'gate_in', 'gate_out');
  }
  
  if (userSteps.includes(STEPS.WEIGHBRIDGE)) {
    columns.push('first_weight', 'second_weight', 'gate_pass');
  }
  
  if (userSteps.includes(STEPS.YARD)) {
    columns.push('campus_in', 'campus_out');
  }
  
  return columns;
}

/**
 * Get visible stats/metrics based on user steps
 * @param {number[]} userSteps
 * @returns {string[]} Array of stat keys
 */
export function getVisibleStats(userSteps) {
  const stats = [];
  
  if (userSteps.includes(STEPS.GATE)) {
    stats.push('loading_count', 'unloading_count', 'item_counts');
  }
  
  if (userSteps.includes(STEPS.WEIGHBRIDGE)) {
    stats.push('first_weigh_pending', 'second_weigh_pending', 'gate_pass_pending');
  }
  
  if (userSteps.includes(STEPS.YARD)) {
    stats.push('campus_in_pending', 'campus_out_pending');
  }
  
  return stats;
}

/**
 * Get filterable stages based on user steps
 * @param {number[]} userSteps
 * @returns {string[]} Array of stage keys
 */
export function getFilterableStages(userSteps) {
  const stages = [];
  
  if (userSteps.includes(STEPS.GATE)) {
    stages.push('parking', 'gate_in', 'gate_out');
  }
  
  if (userSteps.includes(STEPS.WEIGHBRIDGE)) {
    stages.push('first_weigh', 'second_weigh', 'gate_pass');
  }
  
  if (userSteps.includes(STEPS.YARD)) {
    stages.push('campus_in', 'campus_out');
  }
  
  return stages;
}
