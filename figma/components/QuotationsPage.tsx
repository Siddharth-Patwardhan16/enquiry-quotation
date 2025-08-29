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
  Calculator,
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react'
import { projectId } from '../utils/supabase/info'

interface QuotationsPageProps {
  accessToken: string
  navigate: (page: string, id?: string) => void
}

export function QuotationsPage({ accessToken, navigate }: QuotationsPageProps) {
  const [quotations, setQuotations] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [filteredQuotations, setFilteredQuotations] = useState([])

  useEffect(() => {
    fetchQuotations()
  }, [])

  useEffect(() => {
    let filtered = quotations

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(quotation => 
        quotation.quotationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quotation.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(quotation => quotation.status === statusFilter)
    }

    setFilteredQuotations(filtered)
  }, [searchTerm, statusFilter, quotations])

  const fetchQuotations = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-cb9ae747/quotations`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setQuotations(data)
        setFilteredQuotations(data)
      }
    } catch (error) {
      console.log('Error fetching quotations:', error)
    } finally {
      setLoading(false)
    }
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0)
  }

  const handleViewQuotation = (quotationId: string) => {
    navigate('quotation-detail', quotationId)
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
    total: quotations.length,
    draft: quotations.filter(q => q.status === 'Draft').length,
    pending: quotations.filter(q => ['Pending', 'Submitted'].includes(q.status)).length,
    won: quotations.filter(q => q.status === 'Won').length
  }

  const totalValue = quotations
    .filter(q => ['Pending', 'Submitted'].includes(q.status))
    .reduce((sum, q) => sum + (q.totalValue || 0), 0)

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900">Quotations</h1>
          <p className="text-gray-600 mt-1">
            Manage customer quotations and track their progress
          </p>
        </div>
        <Button onClick={() => navigate('new-quotation')}>
          <Plus className="mr-2 h-4 w-4" />
          New Quotation
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Quotations</p>
                <p className="text-2xl text-gray-900 mt-1">{statusCounts.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Calculator className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Live Value</p>
                <p className="text-2xl text-gray-900 mt-1">{formatCurrency(totalValue)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl text-gray-900 mt-1">{statusCounts.pending}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Won</p>
                <p className="text-2xl text-gray-900 mt-1">{statusCounts.won}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quotations Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Quotation Management</CardTitle>
              <CardDescription>
                Track and manage all customer quotations
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
                placeholder="Search by quotation number or customer..."
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
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Submitted">Submitted</SelectItem>
                <SelectItem value="Won">Won</SelectItem>
                <SelectItem value="Lost">Lost</SelectItem>
                <SelectItem value="Received">Received</SelectItem>
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
                  <TableHead>Quotation #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotations.length > 0 ? (
                  filteredQuotations.map((quotation) => (
                    <TableRow key={quotation.id} className="hover:bg-gray-50">
                      <TableCell className="text-sm text-gray-900">
                        {quotation.quotationNumber || `#Q${quotation.id?.split('_')[1]?.substring(0, 6)}`}
                      </TableCell>
                      <TableCell className="text-sm text-gray-900">
                        {quotation.customerName}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(quotation.quotationDate || quotation.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm text-gray-900">
                        {formatCurrency(quotation.totalValue)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {quotation.validityPeriod ? 
                          new Date(quotation.validityPeriod).toLocaleDateString() : 
                          'N/A'
                        }
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(quotation.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewQuotation(quotation.id)}
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
                          ? 'No quotations found matching your criteria.' 
                          : 'No quotations found.'}
                      </div>
                      {!searchTerm && statusFilter === 'all' && (
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => navigate('new-quotation')}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Create First Quotation
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {filteredQuotations.length > 0 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                Showing {filteredQuotations.length} of {quotations.length} quotations
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}