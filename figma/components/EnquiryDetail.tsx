import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { ArrowLeft, FileText, Calendar, User, Building, Calculator, Download } from 'lucide-react'
import { Alert, AlertDescription } from './ui/alert'
import { projectId } from '../utils/supabase/info'

interface EnquiryDetailProps {
  accessToken: string
  navigate: (page: string, id?: string) => void
  selectedId: string
}

export function EnquiryDetail({ accessToken, navigate, selectedId }: EnquiryDetailProps) {
  const [enquiry, setEnquiry] = useState(null)
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (selectedId) {
      fetchEnquiryData()
      fetchDocuments()
    }
  }, [selectedId])

  const fetchEnquiryData = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-cb9ae747/enquiries`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      )
      
      if (response.ok) {
        const enquiries = await response.json()
        const enquiryData = enquiries.find(e => e.id === selectedId)
        setEnquiry(enquiryData)
      }
    } catch (error) {
      console.log('Error fetching enquiry:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDocuments = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-cb9ae747/documents/enquiry/${selectedId}`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      )
      
      if (response.ok) {
        const documentsData = await response.json()
        setDocuments(documentsData)
      }
    } catch (error) {
      console.log('Error fetching documents:', error)
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdating(true)
    try {
      // This would update the enquiry status
      setEnquiry(prev => ({ ...prev, status: newStatus }))
    } catch (error) {
      console.log('Error updating status:', error)
    } finally {
      setUpdating(false)
    }
  }

  if (loading || !enquiry) {
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
      'New': { color: 'bg-blue-100 text-blue-800' },
      'In Progress': { color: 'bg-orange-100 text-orange-800' },
      'Quoted': { color: 'bg-purple-100 text-purple-800' },
      'Closed': { color: 'bg-gray-100 text-gray-800' }
    }

    const config = statusConfig[status] || statusConfig['New']
    
    return (
      <Badge className={config.color}>
        {status}
      </Badge>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('enquiries')} className="p-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl text-gray-900">{enquiry.subject}</h1>
            <p className="text-gray-600 mt-1">
              Enquiry from {enquiry.customerName}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline"
            onClick={() => navigate('customer-detail', enquiry.customerId)}
          >
            <Building className="mr-2 h-4 w-4" />
            View Customer
          </Button>
          <Button onClick={() => navigate('new-quotation', selectedId)}>
            <Calculator className="mr-2 h-4 w-4" />
            Create Quotation
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Enquiry Details */}
          <Card>
            <CardHeader>
              <CardTitle>Enquiry Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Enquiry Date</p>
                  <p className="text-gray-900 flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    {new Date(enquiry.enquiryDate || enquiry.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Marketing Person</p>
                  <p className="text-gray-900 flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    {enquiry.marketingPerson || 'Unassigned'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Expected Volume</p>
                  <p className="text-gray-900">
                    {enquiry.expectedVolume || 'Not specified'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Estimated Value</p>
                  <p className="text-gray-900">
                    {enquiry.estimatedValue ? 
                      `$${enquiry.estimatedValue.toLocaleString()}` : 
                      'Not specified'
                    }
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Urgency</p>
                  <Badge variant={enquiry.urgency === 'High' ? 'destructive' : 'secondary'}>
                    {enquiry.urgency || 'Medium'}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Source</p>
                  <p className="text-gray-900">{enquiry.source || 'Email'}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Description</p>
                <div className="mt-2 p-3 bg-gray-50 rounded-md">
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {enquiry.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Supporting Documents */}
          {documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Supporting Documents</CardTitle>
                <CardDescription>
                  Files attached to this enquiry
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-900">{doc.fileName}</p>
                          <p className="text-xs text-gray-500">
                            {(doc.fileSize / 1024 / 1024).toFixed(2)} MB • 
                            {new Date(doc.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => window.open(doc.url)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
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
                {getStatusBadge(enquiry.status)}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-gray-500">Update Status</label>
                <Select 
                  value={enquiry.status} 
                  onValueChange={handleStatusUpdate}
                  disabled={updating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Quoted">Quoted</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full"
                onClick={() => navigate('new-quotation', selectedId)}
              >
                <Calculator className="mr-2 h-4 w-4" />
                Create Quotation
              </Button>
              
              <Button variant="outline" className="w-full">
                <FileText className="mr-2 h-4 w-4" />
                Log Communication
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('customer-detail', enquiry.customerId)}
              >
                <Building className="mr-2 h-4 w-4" />
                View Customer
              </Button>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Company</p>
                  <p className="text-gray-900">{enquiry.customerName}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Enquiry ID</p>
                  <p className="text-xs text-gray-600 font-mono">
                    #{enquiry.id?.split('_')[1]?.substring(0, 8)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}