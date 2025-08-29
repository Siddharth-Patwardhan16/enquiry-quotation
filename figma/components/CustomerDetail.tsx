import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import { ArrowLeft, Building, Mail, Phone, MapPin, Edit, Plus } from 'lucide-react'
import { projectId } from '../utils/supabase/info'

interface CustomerDetailProps {
  accessToken: string
  navigate: (page: string, id?: string) => void
  selectedId: string
}

export function CustomerDetail({ accessToken, navigate, selectedId }: CustomerDetailProps) {
  const [customer, setCustomer] = useState(null)
  const [enquiries, setEnquiries] = useState([])
  const [quotations, setQuotations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (selectedId) {
      fetchCustomerData()
    }
  }, [selectedId])

  const fetchCustomerData = async () => {
    try {
      // Fetch customer details
      const customerResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-cb9ae747/customers`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      )
      
      if (customerResponse.ok) {
        const customers = await customerResponse.json()
        const customerData = customers.find(c => c.id === selectedId)
        setCustomer(customerData)
      }

      // Fetch related enquiries
      const enquiriesResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-cb9ae747/enquiries`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      )
      
      if (enquiriesResponse.ok) {
        const enquiriesData = await enquiriesResponse.json()
        setEnquiries(enquiriesData.filter(e => e.customerId === selectedId))
      }

      // Fetch related quotations  
      const quotationsResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-cb9ae747/quotations`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      )
      
      if (quotationsResponse.ok) {
        const quotationsData = await quotationsResponse.json()
        setQuotations(quotationsData.filter(q => q.customerId === selectedId))
      }
    } catch (error) {
      console.log('Error fetching customer data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !customer) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount || 0)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('customers')} className="p-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl text-gray-900">{customer.customerName}</h1>
            <p className="text-gray-600 mt-1">Customer Details & Activity</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit Customer
          </Button>
          <Button onClick={() => {
            // Pre-fill new enquiry with this customer
            navigate('new-enquiry')
          }}>
            <Plus className="mr-2 h-4 w-4" />
            New Enquiry
          </Button>
        </div>
      </div>

      {/* Customer Information Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5" />
              <span>Company Information</span>
            </CardTitle>
            <Badge variant={customer.isNewCustomer ? "default" : "secondary"}>
              {customer.isNewCustomer ? 'New Customer' : 'Existing Customer'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="text-gray-900">
                    {customer.address}<br />
                    {customer.city}, {customer.state} {customer.zipCode}<br />
                    {customer.country}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-gray-900">{customer.email}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-gray-900">{customer.phone}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Tax ID</p>
                <p className="text-gray-900">{customer.taxID}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Customer Since</p>
                <p className="text-gray-900">
                  {new Date(customer.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Tabs */}
      <Tabs defaultValue="enquiries" className="space-y-6">
        <TabsList>
          <TabsTrigger value="enquiries">
            Enquiries ({enquiries.length})
          </TabsTrigger>
          <TabsTrigger value="quotations">
            Quotations ({quotations.length})
          </TabsTrigger>
          <TabsTrigger value="communications">
            Communications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="enquiries">
          <Card>
            <CardHeader>
              <CardTitle>Customer Enquiries</CardTitle>
              <CardDescription>
                All enquiries received from this customer
              </CardDescription>
            </CardHeader>
            <CardContent>
              {enquiries.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Subject</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Marketing Person</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enquiries.map((enquiry) => (
                        <TableRow key={enquiry.id} className="hover:bg-gray-50">
                          <TableCell className="text-gray-900">
                            {enquiry.subject}
                          </TableCell>
                          <TableCell className="text-gray-500">
                            {new Date(enquiry.enquiryDate || enquiry.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={enquiry.status === 'New' ? 'default' : 'secondary'}>
                              {enquiry.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-500">
                            {enquiry.marketingPerson || 'Unassigned'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => navigate('enquiry-detail', enquiry.id)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No enquiries found for this customer.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quotations">
          <Card>
            <CardHeader>
              <CardTitle>Customer Quotations</CardTitle>
              <CardDescription>
                All quotations sent to this customer
              </CardDescription>
            </CardHeader>
            <CardContent>
              {quotations.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Quotation #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quotations.map((quotation) => (
                        <TableRow key={quotation.id} className="hover:bg-gray-50">
                          <TableCell className="text-gray-900">
                            {quotation.quotationNumber}
                          </TableCell>
                          <TableCell className="text-gray-500">
                            {new Date(quotation.quotationDate || quotation.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-gray-900">
                            {formatCurrency(quotation.totalValue)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={quotation.status === 'Won' ? 'default' : 'secondary'}>
                              {quotation.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => navigate('quotation-detail', quotation.id)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No quotations found for this customer.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communications">
          <Card>
            <CardHeader>
              <CardTitle>Communication History</CardTitle>
              <CardDescription>
                All communications with this customer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Communication tracking coming soon.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}