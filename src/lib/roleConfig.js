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
  'View Only Admin': '/admin',
  Gatekeeper: '/gatekeeper',
  Driver: '/driver',
  'Logistics Manager': '/logistics',
  'Contract Manager': '/contracts',
};

export function getPanelPathForRole(roleName) {
  // Admin and SuperAdmin go to admin dashboard
  if (roleName === 'Admin' || roleName === 'SuperAdmin' || roleName === 'View Only Admin') {
    return '/admin';
  }
  if (roleName === 'Gatekeeper') {
    return '/gatekeeper';
  }
  if (roleName === 'Driver') {
    return '/driver';
  }
  if (roleName === 'Logistics Manager') {
    return '/logistics';
  }
  if (roleName === 'Contract Manager') {
    return '/contracts';
  }
  // All other users go to common user dashboard
  return '/dashboard';
}

// Nav items per role (path, label, IconComponent)
// Updated structure to support nesting:
// { label: 'Group Name', IconComponent: Icon, children: [ ...items ] }
export const ROLE_NAV = {
  Admin: [
    { 
      label: 'Dashboard', 
      path: '/admin', // Click goes here
      IconComponent: DashboardIcon,
      children: [
        { path: '/admin', label: 'Main Dashboard', IconComponent: ScrollIcon, requiredPermissions: ['manage_masters', '*'] },
        { path: '/admin/contracts', label: 'Contract Dashboard', IconComponent: ScrollIcon, requiredPermissions: ['manage_masters', '*'] },
        { path: '/admin/logistic-dashboard', label: 'Logistic Dashboard', IconComponent: TruckIcon, requiredPermissions: ['view_reports', '*'] },
      ]
    },
    { path: '/admin/reports', label: 'Reports', IconComponent: ChartIcon, requiredPermissions: ['view_reports', '*'] },
    { 
      label: 'Masters', 
      path: '/admin/items', // Default to Items
      IconComponent: ClipboardIcon,
      requiredPermissions: ['manage_masters', '*'],
      children: [
        { path: '/admin/items', label: 'Items', IconComponent: ClipboardIcon, countKey: 'items', requiredPermissions: ['manage_masters', '*'] },
        { path: '/admin/parties', label: 'Party Master', IconComponent: UsersIcon, countKey: 'parties', requiredPermissions: ['manage_masters', '*'] },
        { path: '/admin/transporters', label: 'Transporter Master', IconComponent: TruckIcon, countKey: 'transporters', requiredPermissions: ['manage_masters', '*'] },
        { path: '/admin/vehicles', label: 'Vehicle Master', IconComponent: TruckIcon, countKey: 'vehicles', requiredPermissions: ['manage_masters', '*'] },
        { path: '/admin/drivers', label: 'Driver Master', IconComponent: UserIcon, countKey: 'drivers', requiredPermissions: ['manage_masters', '*'] },
        { path: '/admin/brokers', label: 'Broker Master', IconComponent: UsersIcon, countKey: 'brokers', requiredPermissions: ['manage_masters', '*'] },
      ]
    },
    { path: '/admin/users', label: 'User', IconComponent: UserIcon, countKey: 'users', requiredPermissions: ['manage_users', '*'] },
    { path: '/admin/roles', label: 'Role', IconComponent: ShieldIcon, requiredPermissions: ['manage_roles', '*'] },
    // { path: '/admin/permissions', label: 'Permission', IconComponent: KeyIcon, requiredPermissions: ['manage_roles', '*'] },
    { path: '/admin/gate', label: 'Gate', IconComponent: GateIcon, requiredPermissions: ['create_transactions', 'confirm_stages', '*'] },
  ],
  'View Only Admin': [
    { 
      label: 'Dashboard', 
      path: '/admin', // Click goes here
      IconComponent: DashboardIcon,
      children: [
        { path: '/admin', label: 'Main Dashboard', IconComponent: ScrollIcon, requiredPermissions: [] },
        { path: '/admin/contracts', label: 'Contract Dashboard', IconComponent: ScrollIcon, requiredPermissions: [] },
        { path: '/admin/logistic-dashboard', label: 'Logistic Dashboard', IconComponent: TruckIcon, requiredPermissions: [] },
      ]
    },
    { path: '/admin/reports', label: 'Reports', IconComponent: ChartIcon, requiredPermissions: [] },
    { 
      label: 'Masters', 
      path: '/admin/items', // Default to Items
      IconComponent: ClipboardIcon,
      requiredPermissions: [],
      children: [
        { path: '/admin/items', label: 'Items', IconComponent: ClipboardIcon, countKey: 'items', requiredPermissions: [] },
        { path: '/admin/parties', label: 'Party Master', IconComponent: UsersIcon, countKey: 'parties', requiredPermissions: [] },
        { path: '/admin/transporters', label: 'Transporter Master', IconComponent: TruckIcon, countKey: 'transporters', requiredPermissions: [] },
        { path: '/admin/vehicles', label: 'Vehicle Master', IconComponent: TruckIcon, countKey: 'vehicles', requiredPermissions: [] },
        { path: '/admin/drivers', label: 'Driver Master', IconComponent: UserIcon, countKey: 'drivers', requiredPermissions: [] },
        { path: '/admin/brokers', label: 'Broker Master', IconComponent: UsersIcon, countKey: 'brokers', requiredPermissions: [] },
      ]
    },
    // { path: '/admin/users', label: 'User', IconComponent: UserIcon, countKey: 'users', requiredPermissions: [] },
    // { path: '/admin/roles', label: 'Role', IconComponent: ShieldIcon, requiredPermissions: [] },
    // { path: '/admin/permissions', label: 'Permission', IconComponent: KeyIcon, requiredPermissions: [] },
    { path: '/admin/gate', label: 'Gate', IconComponent: GateIcon, requiredPermissions: [] },
  ],
  Gatekeeper: [
    { path: '/gatekeeper', label: 'Dashboard', IconComponent: DashboardIcon },
    { path: '/gatekeeper/gate', label: 'Gate', IconComponent: GateIcon, requiredPermissions: ['create_transactions'] },
    { path: '/gatekeeper/items', label: 'Items', IconComponent: ClipboardIcon, requiredPermissions: ['view_masters'] },
    { path: '/gatekeeper/parties', label: 'Parties', IconComponent: UsersIcon, requiredPermissions: ['view_masters'] },
    { path: '/gatekeeper/transporters', label: 'Transporters', IconComponent: TruckIcon, requiredPermissions: ['view_masters'] },
    { path: '/gatekeeper/vehicles', label: 'Vehicles', IconComponent: TruckIcon, countKey: 'vehicles', requiredPermissions: ['view_masters'] },
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
  Driver: [
    { path: '/driver', label: 'Dashboard', IconComponent: DashboardIcon },
  ],
  'Logistics Manager': [
    { path: '/logistics', label: 'Logistic Dashboard', IconComponent: TruckIcon },
    { path: '/logistics/items', label: 'Items', IconComponent: ClipboardIcon },
    { path: '/logistics/vehicles', label: 'Vehicles', IconComponent: TruckIcon },
  ],
  'Contract Manager': [
    { path: '/contracts', label: 'Contract Dashboard', IconComponent: ScrollIcon },
    { path: '/contracts/parties', label: 'Party Master', IconComponent: UsersIcon },
    { path: '/contracts/brokers', label: 'Broker Master', IconComponent: UsersIcon },
    { path: '/contracts/items', label: 'Items', IconComponent: ClipboardIcon },
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
  if (!userPermissions || userPermissions.length === 0) {
     return navItems.map(item => {
        const hasPerm = !item.requiredPermissions || item.requiredPermissions.length === 0;
        
        if (item.children) {
           const filteredChildren = item.children.filter(child => !child.requiredPermissions || child.requiredPermissions.length === 0);
           if (filteredChildren.length > 0) {
              return { ...item, children: filteredChildren };
           }
           return hasPerm && item.path ? item : null;
        }
        return hasPerm ? item : null;
     }).filter(Boolean);
  }
  
  return navItems.map(item => {
    const hasPerm = !item.requiredPermissions || item.requiredPermissions.length === 0 || 
                   item.requiredPermissions.some(perm => userPermissions.includes(perm));
    
    if (item.children) {
       const filteredChildren = item.children.filter(child => {
          if (!child.requiredPermissions || child.requiredPermissions.length === 0) return true;
          return child.requiredPermissions.some(perm => userPermissions.includes(perm));
       });
       
       if (filteredChildren.length > 0) {
          return { ...item, children: filteredChildren };
       }
       // If a menu has NO filtered children, but the parent itself has permission and no explicit path, it usually should be hidden (empty folder).
       // However, if it HAS an explicit path and permission, show it.
       return hasPerm && item.path ? item : null;
    }

    return hasPerm ? item : null;
  }).filter(Boolean);
}
