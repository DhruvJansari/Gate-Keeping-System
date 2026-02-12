import {
  DashboardIcon,
  ClipboardIcon,
  UsersIcon,
  TruckIcon,
  UserIcon,
  ShieldIcon,
  KeyIcon,
  GateIcon,
  DocumentIcon,
  ChartIcon,
  ScaleIcon,
  RefreshIcon,
  ScrollIcon,
} from '@/components/Icons';

// Simplified routing: Admin → /admin, All others → /dashboard
export const ROLE_PANEL_MAP = {
  Admin: '/admin',
  SuperAdmin: '/admin',
  Gatekeeper: '/gatekeeper',
};

export function getPanelPathForRole(roleName) {
  // Admin and SuperAdmin go to admin dashboard
  if (roleName === 'Admin' || roleName === 'SuperAdmin') {
    return '/admin';
  }
  if (roleName === 'Gatekeeper') {
    return '/gatekeeper';
  }
  // All other users go to common user dashboard
  return '/dashboard';
}

// Nav items per role (path, label, IconComponent)
export const ROLE_NAV = {
  Admin: [
    { path: '/admin', label: 'Dashboard', IconComponent: DashboardIcon },
    { path: '/admin/reports', label: 'Reports', IconComponent: ChartIcon, requiredPermissions: ['view_reports', '*'] },
    { path: '/admin/items', label: 'Items', IconComponent: ClipboardIcon, countKey: 'items', requiredPermissions: ['manage_masters', '*'] },
    { path: '/admin/parties', label: 'Party Master', IconComponent: UsersIcon, countKey: 'parties', requiredPermissions: ['manage_masters', '*'] },
    { path: '/admin/transporters', label: 'Transporter Master', IconComponent: TruckIcon, countKey: 'transporters', requiredPermissions: ['manage_masters', '*'] },
    { path: '/admin/users', label: 'User', IconComponent: UserIcon, countKey: 'users', requiredPermissions: ['manage_users', '*'] },
    { path: '/admin/roles', label: 'Role', IconComponent: ShieldIcon, requiredPermissions: ['manage_roles', '*'] },
    { path: '/admin/permissions', label: 'Permission', IconComponent: KeyIcon, requiredPermissions: ['manage_roles', '*'] },
    { path: '/admin/gate', label: 'Gate', IconComponent: GateIcon, requiredPermissions: ['create_transactions', 'confirm_stages', '*'] },
  ],
  Gatekeeper: [
    { path: '/gatekeeper', label: 'Dashboard', IconComponent: DashboardIcon },
    { path: '/gatekeeper/gate', label: 'Gate', IconComponent: GateIcon, requiredPermissions: ['create_transactions'] },
    { path: '/gatekeeper/items', label: 'Items', IconComponent: ClipboardIcon, requiredPermissions: ['view_masters'] },
    { path: '/gatekeeper/parties', label: 'Parties', IconComponent: UsersIcon, requiredPermissions: ['view_masters'] },
    { path: '/gatekeeper/transporters', label: 'Transporters', IconComponent: TruckIcon, requiredPermissions: ['view_masters'] },
    { path: '/gatekeeper/reports', label: 'Reports', IconComponent: ChartIcon, requiredPermissions: ['view_reports'] },
  ],
  Weighbridge: [
    { path: '/dashboard', label: 'Dashboard', IconComponent: DashboardIcon },
  ],
  Yard: [
    { path: '/dashboard', label: 'Dashboard', IconComponent: DashboardIcon },
  ],
  Viewer: [
    { path: '/dashboard', label: 'Dashboard', IconComponent: DashboardIcon },
  ],
};

export function getNavForRole(roleName) {
  return ROLE_NAV[roleName] || ROLE_NAV.Viewer;
}

/**
 * Filter navigation items based on user permissions
 * @param {Array} navItems - Navigation items from ROLE_NAV
 * @param {string[]} userPermissions - User's permission codes
 * @returns {Array} Filtered navigation items  
 */
export function filterNavByPermissions(navItems, userPermissions) {
  if (!navItems) return [];
  if (!userPermissions || userPermissions.length === 0) return navItems.filter(item => !item.requiredPermissions);
  
  return navItems.filter(item => {
    // If no permissions required, always show
    if (!item.requiredPermissions || item.requiredPermissions.length === 0) {
      return true;
    }
    
    // Check if user has at least one of the required permissions
    return item.requiredPermissions.some(perm => userPermissions.includes(perm));
  });
}
