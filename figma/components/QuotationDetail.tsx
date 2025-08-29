import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { ArrowLeft, Calculator, FileText, Building, Download, Upload, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from './ui/alert'
import { Separator } from './ui/separator'
import { formatCurrency } from '../utils/quotation-helpers'
import { projectId } from '../utils/supabase/info'

interface QuotationDetailProps {
  accessToken: string
  navigate: (page: string, id?: string) => void
  selectedId: string
}

const LOST_REASONS = [
  'Price too high',
  'Timeline issues',
  'Technical requirements not met',
  'Customer chose competitor', 
  'Project cancelled',
  'Other'
]

export function QuotationDetail({ accessToken, navigate, selectedId }: QuotationDetailProps) {
  const [quotation, setQuotation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showLostReasonModal, setShowLostReasonModal] = useState(false)
  const [lostReason, setLostReason] = useState('')
  const [showPOUpload, setShowPOUpload] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (selectedId) {
      fetchQuotationData()
    }
  }, [selectedId])

  const fetchQuotationData = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-cb9ae747/quotations`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      )
      
      if (response.ok) {
        const quotations = await response.json()
        const quotationData = quotations.find(q => q.id === selectedId)
        setQuotation(quotationData)
      }
    } catch (error) {
      console.log('Error fetching quotation:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    if (newStatus === 'Lost') {
      setShowLostReasonModal(true)
      return
    }

    if (newStatus === 'Received') {
      setShowPOUpload(true)
      return
    }

    await updateQuotationStatus(newStatus)
  }

  const updateQuotationStatus = async (newStatus: string, reason?: string) => {
    setUpdating(true)
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-cb9ae747/quotations/${selectedId}/status`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            status: newStatus,
            ...(reason && { lostReason: reason })
          }),
        }
      )

      if (response.ok) {
        const updatedQuotation = await response.json()
        setQuotation(updatedQuotation)
      }
    } catch (error) {
      console.log('Error updating status:', error)
    } finally {
      setUpdating(false)
      setShowLostReasonModal(false)
      setShowPOUpload(false)
      setLostReason('')
    }
  }

  const handleLostReasonSubmit = async () => {
    if (!lostReason) return
    await updateQuotationStatus('Lost', lostReason)
  }

  const handlePOUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('entityType', 'quotation')
      formData.append('entityId', selectedId)

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-cb9ae747/upload`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}` },
          body: formData,
        }
      )

      if (response.ok) {
        await updateQuotationStatus('Received')
      }
    } catch (error) {
      console.log('Error uploading PO:', error)
    } finally {
      setUploading(false)
    }
  }

  if (loading || !quotation) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Draft': { color: 'bg-gray-100 text-gray-800' },
      'Pending': { color: 'bg-yellow-100 text-yellow-800' },
      'Submitted': { color: 'bg-blue-100 text-blue-800' },
      'Won': { color: 'bg-green-100 text-green-800' },
      'Lost': { color: 'bg-red-100 text-red-800' },
      'Received': { color: 'bg-purple-100 text-purple-800' }
    }

    const config = statusConfig[status] || statusConfig['Draft']
    
    return (
      <Badge className={config.color}>
        {status}
      </Badge>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('quotations')} className="p-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl text-gray-900">
              Quotation {quotation.quotationNumber}
            </h1>
            <p className="text-gray-600 mt-1">
              For {quotation.customerName}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('customer-detail', quotation.customerId)}
          >
            <Building className="mr-2 h-4 w-4" />
            View Customer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Quotation Details */}
          <Card>
            <CardHeader>
              <CardTitle>Quotation Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Quotation Date</p>
                  <p className="text-gray-900">
                    {new Date(quotation.quotationDate || quotation.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Valid Until</p>
                  <p className="text-gray-900">
                    {quotation.validityPeriod ? 
                      new Date(quotation.validityPeriod).toLocaleDateString() : 
                      'Not specified'
                    }
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Payment Terms</p>
                  <p className="text-gray-900">{quotation.paymentTerms}</p>
                </div>
              </div>

              {quotation.deliverySchedule && (
                <div>
                  <p className="text-sm text-gray-500">Delivery Schedule</p>
                  <p className="text-gray-900">{quotation.deliverySchedule}</p>
                </div>
              )}

              {quotation.specialInstructions && (
                <div>
                  <p className="text-sm text-gray-500">Special Instructions</p>
                  <div className="mt-2 p-3 bg-gray-50 rounded-md">
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {quotation.specialInstructions}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle>Quoted Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Description</TableHead>
                      <TableHead>Specifications</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotation.lineItems?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-gray-900">
                          {item.materialDescription}
                        </TableCell>
                        <TableCell className="text-gray-500 text-sm">
                          {item.specifications}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.pricePerUnit, quotation.currency)}
                        </TableCell>
                        <TableCell className="text-right text-gray-900">
                          {formatCurrency(item.total, quotation.currency)}
                        </TableCell>
                      </TableRow>
                    )) || (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                          No line items available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Totals */}
              <div className="mt-6 flex justify-end">
                <div className="w-80 space-y-2">
                  <Separator />
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(quotation.subtotal || 0, quotation.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>{formatCurrency(quotation.tax || 0, quotation.currency)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg">
                    <span>Total:</span>
                    <span>{formatCurrency(quotation.totalValue || 0, quotation.currency)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Management */}
          <Card>
            <CardHeader>
              <CardTitle>Status Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Current Status</span>
                {getStatusBadge(quotation.status)}
              </div>
              
              <div className="space-y-2">
                <Label>Update Status</Label>
                <Select 
                  value={quotation.status} 
                  onValueChange={handleStatusUpdate}
                  disabled={updating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Live">Live</SelectItem>
                    <SelectItem value="Submitted">Submitted</SelectItem>
                    <SelectItem value="Won">Won</SelectItem>
                    <SelectItem value="Lost">Lost</SelectItem>
                    <SelectItem value="Received">Received</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {quotation.lostReason && (
                <div>
                  <p className="text-sm text-gray-500">Lost Reason</p>
                  <p className="text-red-600 text-sm">{quotation.lostReason}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Total Value</p>
                <p className="text-xl text-gray-900">
                  {formatCurrency(quotation.totalValue || 0, quotation.currency)}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Items Count</p>
                <p className="text-gray-900">{quotation.lineItems?.length || 0} items</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Currency</p>
                <p className="text-gray-900">{quotation.currency || 'USD'}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Quotation ID</p>
                <p className="text-xs text-gray-600 font-mono">
                  #{quotation.id?.split('_')[1]?.substring(0, 8)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Lost Reason Modal */}
      <Dialog open={showLostReasonModal} onOpenChange={setShowLostReasonModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span>Mark as Lost</span>
            </DialogTitle>
            <DialogDescription>
              Please select a reason for marking this quotation as lost. This information helps improve future quotations.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Lost Reason *</Label>
              <Select value={lostReason} onValueChange={setLostReason} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {LOST_REASONS.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={() => setShowLostReasonModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleLostReasonSubmit} 
                disabled={!lostReason || updating}
                variant="destructive"
              >
                {updating ? 'Updating...' : 'Mark as Lost'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* PO Upload Modal */}
      <Dialog open={showPOUpload} onOpenChange={setShowPOUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5 text-green-500" />
              <span>Upload Purchase Order</span>
            </DialogTitle>
            <DialogDescription>
              Please upload the purchase order received from the customer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="po-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm text-gray-600">
                      <Button type="button" variant="outline" disabled={uploading}>
                        {uploading ? 'Uploading...' : 'Choose PO file'}
                      </Button>
                    </span>
                    <input
                      id="po-upload"
                      name="po-upload"
                      type="file"
                      className="sr-only"
                      onChange={handlePOUpload}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    PDF, DOC, or image files
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowPOUpload(false)}>
                Skip for now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}