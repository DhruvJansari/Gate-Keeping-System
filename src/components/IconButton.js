'use client';

import { ViewIcon, EditIcon, DeleteIcon } from '@/components/Icons';

/**
 * Icon button variants configuration
 */
const variants = {
  view: {
    icon: ViewIcon,
    className: 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700',
    label: 'View',
  },
  edit: {
    icon: EditIcon,
    className: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700',
    label: 'Edit',
  },
  delete: {
    icon: DeleteIcon,
    className: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
    label: 'Delete',
  },
};

/**
 * Reusable icon button component for datatable actions
 * @param {Object} props
 * @param {'view'|'edit'|'delete'} props.variant - Button variant
 * @param {Function} props.onClick - Click handler
 * @param {boolean} props.disabled -Disabled state
 * @param {string} props.className - Additional classes
 */
export function IconButton({ variant, onClick, disabled = false, className = '' }) {
  const config = variants[variant];
  
  if (!config) {
    console.error(`IconButton: Invalid variant "${variant}". Use 'view', 'edit', or 'delete'.`);
    return null;
  }

  const Icon = config.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-white shadow-md transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${config.className} ${className}`}
      title={config.label}
      aria-label={config.label}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

/**
 * Action button group for datatables
 * @param {Object} props
 * @param {Function} props.onView - View handler
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onDelete - Delete handler
 * @param {boolean} props.hideView - Hide view button
 * @param {boolean} props.hideEdit - Hide edit button
 * @param {boolean} props.hideDelete - Hide delete button
 */
export function ActionButtons({ 
  onView, 
  onEdit, 
  onDelete, 
  hideView = false,
  hideEdit = false,
  hideDelete = false 
}) {
  return (
    <div className="flex items-center gap-2 justify-center">
      {!hideView && onView && (
        <IconButton variant="view" onClick={onView} />
      )}
      {!hideEdit && onEdit && (
        <IconButton variant="edit" onClick={onEdit} />
      )}
      {!hideDelete && onDelete && (
        <IconButton variant="delete" onClick={onDelete} />
      )}
    </div>
  );
}
