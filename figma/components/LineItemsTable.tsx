import React from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import { Plus, Trash2 } from 'lucide-react'
import { LineItem, calculateLineItemTotal, formatCurrency } from '../utils/quotation-helpers'

interface LineItemsTableProps {
  lineItems: LineItem[]
  currency: string
  onUpdateLineItem: (id: string, field: string, value: any) => void
  onAddLineItem: () => void
  onRemoveLineItem: (id: string) => void
}

export function LineItemsTable({ 
  lineItems, 
  currency, 
  onUpdateLineItem, 
  onAddLineItem, 
  onRemoveLineItem 
}: LineItemsTableProps) {
  const handleLineItemChange = (id: string, field: string, value: any) => {
    let updatedValue = value
    
    if (field === 'quantity' || field === 'pricePerUnit') {
      updatedValue = parseFloat(value) || 0
    }
    
    onUpdateLineItem(id, field, updatedValue)
    
    // Recalculate total for this line item
    if (field === 'quantity' || field === 'pricePerUnit') {
      const lineItem = lineItems.find(item => item.id === id)
      if (lineItem) {
        const quantity = field === 'quantity' ? updatedValue : lineItem.quantity
        const pricePerUnit = field === 'pricePerUnit' ? updatedValue : lineItem.pricePerUnit
        const total = calculateLineItemTotal(quantity, pricePerUnit)
        onUpdateLineItem(id, 'total', total)
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg text-gray-900">Line Items</h4>
        <Button type="button" variant="outline" size="sm" onClick={onAddLineItem}>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[300px]">Material Description</TableHead>
              <TableHead className="w-[200px]">Specifications</TableHead>
              <TableHead className="w-[100px]">Quantity</TableHead>
              <TableHead className="w-[120px]">Price Per Unit</TableHead>
              <TableHead className="w-[120px]">Total</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lineItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Input
                    value={item.materialDescription}
                    onChange={(e) => handleLineItemChange(item.id, 'materialDescription', e.target.value)}
                    placeholder="Enter material description"
                  />
                </TableCell>
                <TableCell>
                  <Textarea
                    value={item.specifications}
                    onChange={(e) => handleLineItemChange(item.id, 'specifications', e.target.value)}
                    placeholder="Enter specifications"
                    rows={2}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleLineItemChange(item.id, 'quantity', e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.pricePerUnit}
                    onChange={(e) => handleLineItemChange(item.id, 'pricePerUnit', e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <div className="text-right text-gray-900">
                    {formatCurrency(item.total, currency)}
                  </div>
                </TableCell>
                <TableCell>
                  {lineItems.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveLineItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}