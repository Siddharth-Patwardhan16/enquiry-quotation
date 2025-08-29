import React, { useEffect, useState } from 'react'
import { apiClient } from '../utils/api'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Search, Plus, Eye, FileText } from 'lucide-react'

interface Enquiry {
  id: string
  customerId: string
  customerName: string
  subject: string
  status: 'New' | 'In Progress' | 'Quoted' | 'Closed'
  marketingPerson: string
  enquiryDate: string
  description: string
  requirements: string
  createdAt: string
}

interface EnquiryListProps {
  onSelectEnquiry: (enquiry: Enquiry) => void
  onCreateEnquiry: () => void
  onCreateQuotation: (enquiry: Enquiry) => void
}

export function EnquiryList({ onSelectEnquiry, onCreateEnquiry, onCreateQuotation }: EnquiryListProps) {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    loadEnquiries()
  }, [])

  const loadEnquiries = async () => {
    try {
      const result = await apiClient.getEnquiries()
      setEnquiries(result.enquiries)
    } catch (error) {
      console.error('Failed to load enquiries:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredEnquiries = enquiries.filter(enquiry => {
    const matchesSearch = 
      enquiry.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enquiry.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enquiry.marketingPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enquiry.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || enquiry.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'New': return 'default'
      case 'In Progress': return 'secondary'
      case 'Quoted': return 'outline'
      case 'Closed': return 'destructive'
      default: return 'secondary'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl text-gray-900">Enquiries</h1>
          <p className="text-gray-600 mt-1">Manage customer enquiries and convert them to quotations</p>
        </div>
        <Button onClick={onCreateEnquiry} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          New Enquiry
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search enquiries by subject, customer, or marketing person..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Quoted">Quoted</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Enquiry Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Enquiries ({filteredEnquiries.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Enquiry ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Marketing Person</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEnquiries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    {searchQuery || statusFilter !== 'all' ? 
                      'No enquiries found matching your filters.' : 
                      'No enquiries yet. Create your first enquiry!'
                    }
                  </TableCell>
                </TableRow>
              ) : (
                filteredEnquiries.map((enquiry) => (
                  <TableRow key={enquiry.id}>
                    <TableCell>
                      <div className="text-sm text-gray-900">{enquiry.id.slice(-8)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-gray-900">{enquiry.customerName}</div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <div className="text-gray-900 truncate">{enquiry.subject}</div>
                        <div className="text-sm text-gray-500 truncate">{enquiry.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>{enquiry.marketingPerson}</TableCell>
                    <TableCell>
                      {new Date(enquiry.enquiryDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(enquiry.status)}>
                        {enquiry.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onSelectEnquiry(enquiry)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        {enquiry.status !== 'Quoted' && enquiry.status !== 'Closed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onCreateQuotation(enquiry)}
                          >
                            <FileText className="w-4 h-4 mr-1" />
                            Quote
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}