import { Customer, CombinedEntity, SortField, SortOrder } from '../_types/customer.types';

/**
 * Debounce function to limit the rate of function execution
 */
export function debounce<T extends (..._args: never[]) => unknown>(
  func: T,
  wait: number
): (..._args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (..._args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(..._args), wait);
  };
}

/**
 * Format customer name for display
 */
export function formatCustomerName(customer: Customer | CombinedEntity): string {
  return customer.name.trim();
}

/**
 * Format customer designation for display
 */
export function formatCustomerDesignation(customer: Customer | CombinedEntity): string {
  return customer.designation?.trim() ?? '-';
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(customer: Customer | CombinedEntity): string {
  return customer.phoneNumber?.trim() ?? '-';
}

/**
 * Format email for display
 */
export function formatEmail(customer: Customer | CombinedEntity): string {
  return customer.emailId?.trim() ?? '-';
}

/**
 * Check if customer has contact information
 */
export function hasContactInfo(customer: Customer | CombinedEntity): boolean {
  return !!(customer.phoneNumber ?? customer.emailId);
}

/**
 * Get customer initials for avatar
 */
export function getCustomerInitials(customer: Customer | CombinedEntity): string {
  const name = customer.name.trim();
  const words = name.split(' ');
  
  if (words.length === 1) {
    return words[0]?.charAt(0).toUpperCase() ?? '';
  }
  
  return (words[0]?.charAt(0) + words[words.length - 1]?.charAt(0)).toUpperCase();
}

/**
 * Sort customers by given field and order
 */
export function sortCustomers(
  customers: Customer[],
  sortBy: SortField,
  sortOrder: SortOrder
): Customer[] {
  return [...customers].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'designation':
        aValue = a.designation?.toLowerCase() || '';
        bValue = b.designation?.toLowerCase() || '';
        break;
      case 'emailId':
        aValue = a.emailId?.toLowerCase() || '';
        bValue = b.emailId?.toLowerCase() || '';
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      default:
        return 0;
    }

    if (aValue < bValue) {
      return sortOrder === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortOrder === 'asc' ? 1 : -1;
    }
    return 0;
  });
}

/**
 * Generate pagination info text
 */
export function getPaginationInfo(
  currentPage: number,
  pageSize: number,
  totalCount: number
): string {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);
  
  if (totalCount === 0) {
    return 'No items found';
  }
  
  return `Showing ${startItem}-${endItem} of ${totalCount} items`;
}

/**
 * Check if customer matches search term
 */
export function matchesSearchTerm(customer: Customer, searchTerm: string): boolean {
  if (!searchTerm.trim()) return true;
  
  const term = searchTerm.toLowerCase();
  const searchableFields = [
    customer.name,
    customer.designation,
    customer.phoneNumber,
    customer.emailId,
  ].filter(Boolean);
  
  return searchableFields.some(field => 
    field?.toLowerCase().includes(term)
  );
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format (basic validation)
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Generate customer export data
 */
export function generateCustomerExportData(customers: CombinedEntity[]): Record<string, string>[] {
  return customers.map(customer => ({
    'Company Name': customer.name,
    'Type': customer.type,
    'Designation': customer.designation ?? '',
    'Phone Number': customer.phoneNumber ?? '',
    'Email ID': customer.emailId ?? '',
    'Created Date': customer.createdAt.toLocaleDateString(),
    'Office Locations': customer.locations
      .filter(loc => loc.type === 'OFFICE')
      .map(loc => loc.name)
      .join(', '),
    'Plant Locations': customer.locations
      .filter(loc => loc.type === 'PLANT')
      .map(loc => loc.name)
      .join(', '),
    'Contact Persons': customer.contactPersons
      .map(contact => `${contact.name} (${contact.designation || 'No designation'})`)
      .join(', '),
  }));
}
