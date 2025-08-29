import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Separator } from './ui/separator'
import { ArrowLeft, Save, Upload, X, FileText, Plus } from 'lucide-react'
import { Alert, AlertDescription } from './ui/alert'
import { Badge } from './ui/badge'
import { projectId } from '../utils/supabase/info'

interface NewEnquiryFormProps {
  accessToken: string
  navigate: (page: string, id?: string) => void
}

export function NewEnquiryForm({ accessToken, navigate }: NewEnquiryFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [customers, setCustomers] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState([])

  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    subject: '',
    description: '',
    enquiryDate: new Date().toISOString().split('T')[0],
    marketingPerson: '',
    expectedVolume: '',
    estimatedValue: '',
    urgency: 'Medium',
    source: 'Email'
  })

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-cb9ae747/customers`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setCustomers(data)
      }
    } catch (error) {
      console.log('Error fetching customers:', error)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }
      
      // Auto-fill customer name when customer is selected
      if (field === 'customerId') {
        const selectedCustomer = customers.find(c => c.id === value)
        if (selectedCustomer) {
          updated.customerName = selectedCustomer.customerName
        }
      }
      
      return updated
    })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setUploading(true)
    const tempEnquiryId = `temp_${Date.now()}`

    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('entityType', 'enquiry')
        formData.append('entityId', tempEnquiryId)

        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-cb9ae747/upload`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
            body: formData,
          }
        )

        if (response.ok) {
          const uploadedFile = await response.json()
          setUploadedFiles(prev => [...prev, uploadedFile])
        }
      }
    } catch (error) {
      console.log('Error uploading files:', error)
      setError('Failed to upload some files')
    } finally {
      setUploading(false)
    }

    // Clear the input
    e.target.value = ''
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
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
      const enquiryData = {
        ...formData,
        estimatedValue: formData.estimatedValue ? parseFloat(formData.estimatedValue) : null,
        expectedVolume: formData.expectedVolume ? parseInt(formData.expectedVolume) : null,
        attachments: uploadedFiles.map(f => f.id)
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-cb9ae747/enquiries`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(enquiryData),
        }
      )

      if (response.ok) {
        const enquiry = await response.json()
        setSuccess(true)
        setTimeout(() => {
          navigate('enquiry-detail', enquiry.id)
        }, 1500)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create enquiry')
      }
    } catch (error) {
      console.log('Error creating enquiry:', error)
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
              <FileText className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg text-gray-900 mb-2">Enquiry Created Successfully!</h3>
            <p className="text-gray-600 mb-4">
              The enquiry has been submitted and assigned for processing.
            </p>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Redirecting to enquiry details...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('enquiries')}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl text-gray-900">New Enquiry</h1>
          <p className="text-gray-600 mt-1">Create a new customer enquiry</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Customer Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>
              Select the customer for this enquiry
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerId">Customer *</Label>
                <div className="flex space-x-2">
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
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate('new-customer')}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="enquiryDate">Enquiry Date *</Label>
                <Input
                  id="enquiryDate"
                  type="date"
                  value={formData.enquiryDate}
                  onChange={(e) => handleInputChange('enquiryDate', e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enquiry Details */}
        <Card>
          <CardHeader>
            <CardTitle>Enquiry Details</CardTitle>
            <CardDescription>
              Enter the specifics of the customer enquiry
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                placeholder="Enter enquiry subject"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Detailed description of the enquiry requirements..."
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expectedVolume">Expected Volume</Label>
                <Input
                  id="expectedVolume"
                  type="number"
                  value={formData.expectedVolume}
                  onChange={(e) => handleInputChange('expectedVolume', e.target.value)}
                  placeholder="Quantity expected"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedValue">Estimated Value ($)</Label>
                <Input
                  id="estimatedValue"
                  type="number"
                  step="0.01"
                  value={formData.estimatedValue}
                  onChange={(e) => handleInputChange('estimatedValue', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="urgency">Urgency Level</Label>
                <Select 
                  value={formData.urgency} 
                  onValueChange={(value) => handleInputChange('urgency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="marketingPerson">Assigned Marketing Person</Label>
                <Input
                  id="marketingPerson"
                  value={formData.marketingPerson}
                  onChange={(e) => handleInputChange('marketingPerson', e.target.value)}
                  placeholder="Enter assigned person's name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">Enquiry Source</Label>
                <Select 
                  value={formData.source} 
                  onValueChange={(value) => handleInputChange('source', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Email">Email</SelectItem>
                    <SelectItem value="Phone">Phone</SelectItem>
                    <SelectItem value="Website">Website</SelectItem>
                    <SelectItem value="Trade Show">Trade Show</SelectItem>
                    <SelectItem value="Referral">Referral</SelectItem>
                    <SelectItem value="Direct Visit">Direct Visit</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Supporting Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Supporting Documents</CardTitle>
            <CardDescription>
              Upload any relevant documents or specifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm text-gray-600">
                      <Button type="button" variant="outline" disabled={uploading}>
                        {uploading ? 'Uploading...' : 'Choose files'}
                      </Button>
                    </span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      multiple
                      onChange={handleFileUpload}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    PDF, DOC, XLS, or image files up to 10MB each
                  </p>
                </div>
              </div>
            </div>

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Uploaded Files</Label>
                <div className="space-y-2">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-900">{file.fileName}</p>
                          <p className="text-xs text-gray-500">
                            {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-4 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('enquiries')}
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
                Create Enquiry
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}