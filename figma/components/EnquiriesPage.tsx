import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import { 
  Search, 
  Plus, 
  Eye, 
  Filter,
  FileText,
  Calendar,
  User
} from 'lucide-react'
import { projectId } from '../utils/supabase/info'

interface EnquiriesPageProps {
  accessToken: string
  navigate: (page: string, id?: string) => void
}

export function EnquiriesPage({ accessToken, navigate }: EnquiriesPageProps) {
  const [enquiries, setEnquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [filteredEnquiries, setFilteredEnquiries] = useState([])

  useEffect(() => {
    fetchEnquiries()
  }, [])

  useEffect(() => {
    let filtered = enquiries

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(enquiry => 
        enquiry.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enquiry.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enquiry.marketingPerson?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(enquiry => enquiry.status === statusFilter)
    }

    setFilteredEnquiries(filtered)
  }, [searchTerm, statusFilter, enquiries])

  const fetchEnquiries = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-cb9ae747/enquiries`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setEnquiries(data)
        setFilteredEnquiries(data)
      }
    } catch (error) {
      console.log('Error fetching enquiries:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'New': { variant: 'default', color: 'bg-blue-100 text-blue-800' },
      'In Progress': { variant: 'secondary', color: 'bg-orange-100 text-orange-800' },
      'Quoted': { variant: 'outline', color: 'bg-purple-100 text-purple-800' },
      'Closed': { variant: 'secondary', color: 'bg-gray-100 text-gray-800' }
    }

    const config = statusConfig[status] || statusConfig['New']
    
    return (
      <Badge className={config.color}>
        {status}
      </Badge>
    )
  }

  const handleViewEnquiry = (enquiryId: string) => {
    navigate('enquiry-detail', enquiryId)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  const statusCounts = {
    total: enquiries.length,
    new: enquiries.filter(e => e.status === 'New').length,
    inProgress: enquiries.filter(e => e.status === 'In Progress').length,
    quoted: enquiries.filter(e => e.status === 'Quoted').length
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900">Enquiries</h1>
          <p className="text-gray-600 mt-1">
            Manage customer enquiries and track their progress
          </p>
        </div>
        <Button onClick={() => navigate('new-enquiry')}>
          <Plus className="mr-2 h-4 w-4" />
          New Enquiry
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Enquiries</p>
                <p className="text-2xl text-gray-900 mt-1">{statusCounts.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">New Enquiries</p>
                <p className="text-2xl text-gray-900 mt-1">{statusCounts.new}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Plus className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl text-gray-900 mt-1">{statusCounts.inProgress}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Quoted</p>
                <p className="text-2xl text-gray-900 mt-1">{statusCounts.quoted}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enquiries Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Enquiry Management</CardTitle>
              <CardDescription>
                Track and manage all customer enquiries
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by subject, customer, or marketing person..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Quoted">Quoted</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              More Filters
            </Button>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Enquiry ID</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Marketing Person</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEnquiries.length > 0 ? (
                  filteredEnquiries.map((enquiry) => (
                    <TableRow key={enquiry.id} className="hover:bg-gray-50">
                      <TableCell className="text-sm text-gray-900">
                        #{enquiry.id?.split('_')[1]?.substring(0, 6) || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900">{enquiry.subject}</div>
                        <div className="text-xs text-gray-500 truncate max-w-xs">
                          {enquiry.description}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-900">
                        {enquiry.customerName}
                      </TableCell>
                      <TableCell className="text-sm text-gray-900">
                        {enquiry.marketingPerson || 'Unassigned'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(enquiry.enquiryDate || enquiry.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(enquiry.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewEnquiry(enquiry.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-gray-500">
                        {searchTerm || statusFilter !== 'all' 
                          ? 'No enquiries found matching your criteria.' 
                          : 'No enquiries found.'}
                      </div>
                      {!searchTerm && statusFilter === 'all' && (
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => navigate('new-enquiry')}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Create First Enquiry
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {filteredEnquiries.length > 0 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                Showing {filteredEnquiries.length} of {enquiries.length} enquiries
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}