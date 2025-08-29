export const PAYMENT_TERMS = [
  '15 days',
  '30 days', 
  '45 days',
  '60 days',
  '90 days',
  'Net 30',
  'COD',
  'Advance payment'
]

export const CURRENCIES = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'CAD', label: 'CAD ($)' }
]

export interface LineItem {
  id: string
  materialDescription: string
  specifications: string
  quantity: number
  pricePerUnit: number
  total: number
}

export const createEmptyLineItem = (id: string): LineItem => ({
  id,
  materialDescription: '',
  specifications: '',
  quantity: 1,
  pricePerUnit: 0,
  total: 0
})

export const calculateLineItemTotal = (quantity: number, pricePerUnit: number): number => {
  return quantity * pricePerUnit
}

export const calculateQuotationTotals = (lineItems: LineItem[]) => {
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0)
  const tax = subtotal * 0.1 // 10% tax
  const total = subtotal + tax
  
  return { subtotal, tax, total }
}

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  const currencySymbols = {
    USD: '$',
    EUR: '€', 
    GBP: '£',
    CAD: '$'
  }
  
  return `${currencySymbols[currency] || '$'}${amount.toFixed(2)}`
}

export const generateQuotationNumber = (): string => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const timestamp = now.getTime().toString().slice(-6)
  return `Q${year}${month}${timestamp}`
}