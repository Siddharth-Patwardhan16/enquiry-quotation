import { Customer, Company, CompanyApiResponse, SortField, SortOrder } from '../_types/customer.types';

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
export function formatCustomerName(customer: Customer | Company | CompanyApiResponse): string {
  return customer.name.trim();
}

/**
 * Format customer designation for display
 */
export function formatCustomerDesignation(customer: Customer | Company | CompanyApiResponse): string {
  if ('designation' in customer && customer.designation !== undefined && customer.designation !== null) {
    return customer.designation.trim() ?? '-';
  }
  // For Company type, get designation from primary contact person
  if ('contactPersons' in customer && Array.isArray(customer.contactPersons)) {
    const primaryContact = customer.contactPersons.find(contact => contact.isPrimary);
    return primaryContact?.designation?.trim() ?? '-';
  }
  return '-';
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(customer: Customer | Company | CompanyApiResponse): string {
  if ('phoneNumber' in customer && customer.phoneNumber !== undefined && customer.phoneNumber !== null) {
    return customer.phoneNumber.trim() ?? '-';
  }
  // For Company type, get phone number from primary contact person
  if ('contactPersons' in customer && Array.isArray(customer.contactPersons)) {
    const primaryContact = customer.contactPersons.find(contact => contact.isPrimary);
    return primaryContact?.phoneNumber?.trim() ?? '-';
  }
  return '-';
}

/**
 * Format email for display
 */
export function formatEmail(customer: Customer | Company | CompanyApiResponse): string {
  if ('emailId' in customer && customer.emailId !== undefined && customer.emailId !== null) {
    return customer.emailId.trim() ?? '-';
  }
  // For Company type, get email from primary contact person
  if ('contactPersons' in customer && Array.isArray(customer.contactPersons)) {
    const primaryContact = customer.contactPersons.find(contact => contact.isPrimary);
    return primaryContact?.emailId?.trim() ?? '-';
  }
  return '-';
}

/**
 * Check if customer has contact information
 */
export function hasContactInfo(customer: Customer | Company | CompanyApiResponse): boolean {
  if ('phoneNumber' in customer && customer.phoneNumber !== undefined) {
    return !!(customer.phoneNumber ?? customer.emailId);
  }
  // For Company type, check if any contact person has phone or email
  if ('contactPersons' in customer && Array.isArray(customer.contactPersons)) {
    return customer.contactPersons.some(contact => 
      !!(contact.phoneNumber ?? contact.emailId)
    );
  }
  return false;
}

/**
 * Get customer initials for avatar
 */
export function getCustomerInitials(customer: Customer | Company | CompanyApiResponse): string {
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
        aValue = a.designation?.toLowerCase() ?? '';
        bValue = b.designation?.toLowerCase() ?? '';
        break;
      case 'emailId':
        aValue = a.emailId?.toLowerCase() ?? '';
        bValue = b.emailId?.toLowerCase() ?? '';
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
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
export function generateCustomerExportData(customers: any[]): Record<string, string>[] {
  return customers.map(customer => {
    const primaryContact = Array.isArray(customer.contactPersons) 
      ? customer.contactPersons.find((contact: any) => contact.isPrimary)
      : undefined;
    
    return {
      'Company Name': customer.name,
      'Type': customer.type,
      'Website': customer.website ?? '',
      'Industry': customer.industry ?? '',
      'Designation': primaryContact?.designation ?? '',
      'Phone Number': primaryContact?.phoneNumber ?? '',
      'Email ID': primaryContact?.emailId ?? '',
      'Created Date': customer.createdAt.toLocaleDateString(),
      'Created By': customer.createdBy?.name ?? '',
      'Office Locations': Array.isArray(customer.offices)
        ? customer.offices.map((office: any) => office.name).join(', ')
        : '',
      'Plant Locations': Array.isArray(customer.plants)
        ? customer.plants.map((plant: any) => plant.name).join(', ')
        : '',
      'Contact Persons': Array.isArray(customer.contactPersons)
        ? customer.contactPersons.map((contact: any) => `${contact.name} (${contact.designation ?? 'No designation'})`).join(', ')
        : '',
    };
  });
}
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
