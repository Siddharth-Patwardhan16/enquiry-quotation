import { projectId, publicAnonKey } from './supabase/info'

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-cb9ae747`

export class ApiClient {
  private accessToken: string | null = null

  setAccessToken(token: string | null) {
    this.accessToken = token
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`
    } else {
      headers.Authorization = `Bearer ${publicAnonKey}`
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Auth
  async signup(email: string, password: string, name: string, role: string) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, role }),
    })
  }

  // Customers
  async getCustomers() {
    return this.request<{ customers: any[] }>('/customers')
  }

  async createCustomer(customer: any) {
    return this.request<{ customer: any }>('/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    })
  }

  async getCustomer(id: string) {
    return this.request<{ customer: any }>(`/customers/${id}`)
  }

  // Contacts
  async getContacts(customerId: string) {
    return this.request<{ contacts: any[] }>(`/contacts/${customerId}`)
  }

  async createContact(contact: any) {
    return this.request<{ contact: any }>('/contacts', {
      method: 'POST',
      body: JSON.stringify(contact),
    })
  }

  // Enquiries
  async getEnquiries() {
    return this.request<{ enquiries: any[] }>('/enquiries')
  }

  async createEnquiry(enquiry: any) {
    return this.request<{ enquiry: any }>('/enquiries', {
      method: 'POST',
      body: JSON.stringify(enquiry),
    })
  }

  async getEnquiry(id: string) {
    return this.request<{ enquiry: any }>(`/enquiries/${id}`)
  }

  async updateEnquiry(id: string, enquiry: any) {
    return this.request<{ enquiry: any }>(`/enquiries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(enquiry),
    })
  }

  // Quotations
  async getQuotations() {
    return this.request<{ quotations: any[] }>('/quotations')
  }

  async createQuotation(quotation: any) {
    return this.request<{ quotation: any }>('/quotations', {
      method: 'POST',
      body: JSON.stringify(quotation),
    })
  }

  async getQuotation(id: string) {
    return this.request<{ quotation: any }>(`/quotations/${id}`)
  }

  async updateQuotation(id: string, quotation: any) {
    return this.request<{ quotation: any }>(`/quotations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(quotation),
    })
  }

  // Communications
  async getCommunications(entityType: string, entityId: string) {
    return this.request<{ communications: any[] }>(`/communications/${entityType}/${entityId}`)
  }

  async createCommunication(communication: any) {
    return this.request<{ communication: any }>('/communications', {
      method: 'POST',
      body: JSON.stringify(communication),
    })
  }

  // File upload
  async uploadFile(file: File, bucketType: 'documents' | 'purchase-orders') {
    const formData = new FormData()
    formData.append('file', file)

    const headers: HeadersInit = {}
    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`
    } else {
      headers.Authorization = `Bearer ${publicAnonKey}`
    }

    const response = await fetch(`${API_BASE_URL}/upload/${bucketType}`, {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }))
      throw new Error(error.error || `Upload failed`)
    }

    return response.json()
  }

  // Dashboard
  async getDashboardStats() {
    return this.request<{ stats: any }>('/dashboard/stats')
  }
}

export const apiClient = new ApiClient()