import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { ArrowLeft, Save, Calculator } from 'lucide-react'
import { Alert, AlertDescription } from './ui/alert'
import { Separator } from './ui/separator'
import { LineItemsTable } from './LineItemsTable'
import { 
  LineItem, 
  createEmptyLineItem, 
  calculateQuotationTotals, 
  formatCurrency, 
  generateQuotationNumber,
  PAYMENT_TERMS,
  CURRENCIES
} from '../utils/quotation-helpers'
import { projectId } from '../utils/supabase/info'

interface NewQuotationFormProps {
  accessToken: string
  navigate: (page: string, id?: string) => void
  selectedId?: string
}

export function NewQuotationForm({ accessToken, navigate, selectedId }: NewQuotationFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [customers, setCustomers] = useState([])
  const [enquiries, setEnquiries] = useState([])

  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    enquiryId: selectedId || '',
    quotationNumber: generateQuotationNumber(),
    quotationDate: new Date().toISOString().split('T')[0],
    validityPeriod: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paymentTerms: '30 days',
    deliverySchedule: '',
    specialInstructions: '',
    currency: 'USD'
  })

  const [lineItems, setLineItems] = useState<LineItem[]>([createEmptyLineItem('1')])

  useEffect(() => {
    fetchCustomers()
    fetchEnquiries()
  }, [])

  useEffect(() => {
    if (selectedId && enquiries.length > 0) {
      const enquiry = enquiries.find(e => e.id === selectedId)
      if (enquiry) {
        setFormData(prev => ({
          ...prev,
          customerId: enquiry.customerId,
          customerName: enquiry.customerName,
          enquiryId: enquiry.id
        }))
      }
    }
  }, [selectedId, enquiries])

  const fetchCustomers = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-cb9ae747/customers`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      )
      if (response.ok) {
        const data = await response.json()
        setCustomers(data)
      }
    } catch (error) {
      console.log('Error fetching customers:', error)
    }
  }

  const fetchEnquiries = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-cb9ae747/enquiries`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      )
      if (response.ok) {
        const data = await response.json()
        setEnquiries(data)
      }
    } catch (error) {
      console.log('Error fetching enquiries:', error)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }
      if (field === 'customerId') {
        const selectedCustomer = customers.find(c => c.id === value)
        if (selectedCustomer) {
          updated.customerName = selectedCustomer.customerName
        }
      }
      return updated
    })
  }

  const handleLineItemUpdate = (id: string, field: string, value: any) => {
    setLineItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const handleAddLineItem = () => {
    const newId = (Math.max(...lineItems.map(item => parseInt(item.id))) + 1).toString()
    setLineItems(prev => [...prev, createEmptyLineItem(newId)])
  }

  const handleRemoveLineItem = (id: string) => {
    setLineItems(prev => prev.filter(item => item.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!formData.customerId) {
      setError('Please select a customer')
      setLoading(false)
      return
    }

    try {
      const { subtotal, tax, total } = calculateQuotationTotals(lineItems)
      
      const quotationData = {
        ...formData,
        lineItems,
        subtotal,
        tax,
        totalValue: total
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-cb9ae747/quotations`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(quotationData),
        }
      )

      if (response.ok) {
        const quotation = await response.json()
        setSuccess(true)
        setTimeout(() => {
          navigate('quotation-detail', quotation.id)
        }, 1500)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create quotation')
      }
    } catch (error) {
      console.log('Error creating quotation:', error)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="p-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calculator className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg text-gray-900 mb-2">Quotation Created Successfully!</h3>
            <p className="text-gray-600 mb-4">The quotation has been generated and saved.</p>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Redirecting to quotation details...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { subtotal, tax, total } = calculateQuotationTotals(lineItems)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center space-x-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('quotations')} className="p-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl text-gray-900">New Quotation</h1>
          <p className="text-gray-600 mt-1">Create a new customer quotation</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Quotation Details</CardTitle>
            <CardDescription>Basic quotation information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quotationNumber">Quotation Number</Label>
                <Input
                  id="quotationNumber"
                  value={formData.quotationNumber}
                  onChange={(e) => handleInputChange('quotationNumber', e.target.value)}
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quotationDate">Quotation Date</Label>
                <Input
                  id="quotationDate"
                  type="date"
                  value={formData.quotationDate}
                  onChange={(e) => handleInputChange('quotationDate', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validityPeriod">Valid Until</Label>
                <Input
                  id="validityPeriod"
                  type="date"
                  value={formData.validityPeriod}
                  onChange={(e) => handleInputChange('validityPeriod', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerId">Customer *</Label>
                <Select 
                  value={formData.customerId} 
                  onValueChange={(value) => handleInputChange('customerId', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.customerName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="enquiryId">Related Enquiry</Label>
                <Select 
                  value={formData.enquiryId} 
                  onValueChange={(value) => handleInputChange('enquiryId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an enquiry (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {enquiries.map((enquiry) => (
                      <SelectItem key={enquiry.id} value={enquiry.id}>
                        {enquiry.subject} - {enquiry.customerName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <CardTitle>Items & Pricing</CardTitle>
            <CardDescription>Add items and pricing for this quotation</CardDescription>
          </CardHeader>
          <CardContent>
            <LineItemsTable
              lineItems={lineItems}
              currency={formData.currency}
              onUpdateLineItem={handleLineItemUpdate}
              onAddLineItem={handleAddLineItem}
              onRemoveLineItem={handleRemoveLineItem}
            />
            
            {/* Totals */}
            <div className="mt-6 flex justify-end">
              <div className="w-80 space-y-2">
                <Separator />
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal, formData.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (10%):</span>
                  <span>{formatCurrency(tax, formData.currency)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg">
                  <span>Total:</span>
                  <span>{formatCurrency(total, formData.currency)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms & Conditions */}
        <Card>
          <CardHeader>
            <CardTitle>Terms & Conditions</CardTitle>
            <CardDescription>Commercial terms and delivery details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Select 
                  value={formData.paymentTerms} 
                  onValueChange={(value) => handleInputChange('paymentTerms', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_TERMS.map((term) => (
                      <SelectItem key={term} value={term}>
                        {term}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select 
                  value={formData.currency} 
                  onValueChange={(value) => handleInputChange('currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliverySchedule">Delivery Schedule</Label>
              <Input
                id="deliverySchedule"
                value={formData.deliverySchedule}
                onChange={(e) => handleInputChange('deliverySchedule', e.target.value)}
                placeholder="e.g., 2-3 weeks after order confirmation"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialInstructions">Special Instructions</Label>
              <Textarea
                id="specialInstructions"
                value={formData.specialInstructions}
                onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                placeholder="Any special terms, conditions, or instructions..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-4 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('quotations')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Quotation
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}