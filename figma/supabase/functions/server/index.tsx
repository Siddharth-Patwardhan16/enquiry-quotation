import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'npm:@supabase/supabase-js@2'
import * as kv from './kv_store.tsx'

const app = new Hono()

// Enable CORS for all routes
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// Enable logging
app.use('*', logger(console.log))

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Create storage bucket for documents
async function initializeStorage() {
  const bucketName = 'make-cb9ae747-documents'
  const { data: buckets } = await supabase.storage.listBuckets()
  const bucketExists = buckets?.some(bucket => bucket.name === bucketName)
  
  if (!bucketExists) {
    const { error } = await supabase.storage.createBucket(bucketName, { public: false })
    if (error) {
      console.log('Error creating bucket:', error)
    } else {
      console.log('Document storage bucket created successfully')
    }
  }
}

// Initialize storage on startup
initializeStorage()

// Auth middleware
async function requireAuth(request: Request) {
  const accessToken = request.headers.get('Authorization')?.split(' ')[1]
  if (!accessToken) {
    return { error: 'Missing authorization token', status: 401 }
  }
  
  const { data: { user }, error } = await supabase.auth.getUser(accessToken)
  if (error || !user?.id) {
    return { error: 'Invalid or expired token', status: 401 }
  }
  
  return { user }
}

// Initialize database schema
app.post('/make-server-cb9ae747/init-schema', async (c) => {
  try {
    // Initialize customers
    await kv.set('schema:customers', true)
    
    // Initialize demo data
    const demoCustomers = [
      {
        id: 'cust_001',
        customerName: 'TechCorp Industries',
        address: '123 Business Ave',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        zipCode: '10001',
        phone: '+1-555-0100',
        email: 'contact@techcorp.com',
        taxID: 'TC123456789',
        isNewCustomer: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'cust_002',
        customerName: 'Global Solutions Ltd',
        address: '456 Innovation Drive',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        zipCode: '94105',
        phone: '+1-555-0200',
        email: 'info@globalsolutions.com',
        taxID: 'GS987654321',
        isNewCustomer: true,
        createdAt: new Date().toISOString()
      }
    ]
    
    for (const customer of demoCustomers) {
      await kv.set(`customer:${customer.id}`, customer)
    }
    
    // Initialize demo contacts
    const demoContacts = [
      {
        id: 'contact_001',
        customerId: 'cust_001',
        contactName: 'John Smith',
        designation: 'Procurement Manager',
        email: 'john.smith@techcorp.com',
        phone: '+1-555-0101',
        mobile: '+1-555-0102'
      },
      {
        id: 'contact_002',
        customerId: 'cust_002',
        contactName: 'Sarah Johnson',
        designation: 'Head of Operations',
        email: 'sarah.johnson@globalsolutions.com',
        phone: '+1-555-0201',
        mobile: '+1-555-0202'
      }
    ]
    
    for (const contact of demoContacts) {
      await kv.set(`contact:${contact.id}`, contact)
    }
    
    // Initialize demo employees
    const demoEmployees = [
      {
        id: 'emp_001',
        name: 'Alice Brown',
        email: 'alice@company.com',
        role: 'Manager',
        department: 'Sales'
      },
      {
        id: 'emp_002',
        name: 'Bob Wilson',
        email: 'bob@company.com',
        role: 'Marketing Person',
        department: 'Marketing'
      }
    ]
    
    for (const employee of demoEmployees) {
      await kv.set(`employee:${employee.id}`, employee)
    }
    
    console.log('Schema and demo data initialized successfully')
    return c.json({ success: true, message: 'Schema initialized' })
  } catch (error) {
    console.log('Error initializing schema:', error)
    return c.json({ error: 'Failed to initialize schema' }, 500)
  }
})

// User signup
app.post('/make-server-cb9ae747/signup', async (c) => {
  try {
    const { email, password, name, role } = await c.req.json()
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    })
    
    if (error) {
      console.log('Signup error:', error)
      return c.json({ error: error.message }, 400)
    }
    
    // Store additional user info
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email,
      name,
      role,
      createdAt: new Date().toISOString()
    })
    
    return c.json({ success: true, user: data.user })
  } catch (error) {
    console.log('Signup error:', error)
    return c.json({ error: 'Internal server error during signup' }, 500)
  }
})

// Get dashboard stats
app.get('/make-server-cb9ae747/dashboard/stats', async (c) => {
  const authResult = await requireAuth(c.req.raw)
  if (authResult.error) {
    return c.json({ error: authResult.error }, authResult.status)
  }
  
  try {
    // Get quotations
    const quotations = await kv.getByPrefix('quotation:')
    const activeQuotations = quotations.filter(q => ['Pending', 'Submitted'].includes(q.status))
    const liveValue = activeQuotations.reduce((sum, q) => sum + (q.totalValue || 0), 0)
    
    // Get enquiries
    const enquiries = await kv.getByPrefix('enquiry:')
    const today = new Date().toDateString()
    const newEnquiriesToday = enquiries.filter(e => 
      new Date(e.enquiryDate).toDateString() === today
    ).length
    
    // Calculate win/loss ratio
    const wonQuotations = quotations.filter(q => q.status === 'Won').length
    const lostQuotations = quotations.filter(q => q.status === 'Lost').length
    const winLossRatio = lostQuotations > 0 ? (wonQuotations / lostQuotations).toFixed(2) : 'N/A'
    
    return c.json({
      liveQuotationsValue: liveValue,
      winLossRatio,
      newEnquiriesToday,
      pendingTasks: activeQuotations.length + enquiries.filter(e => e.status === 'New').length
    })
  } catch (error) {
    console.log('Error fetching dashboard stats:', error)
    return c.json({ error: 'Failed to fetch dashboard stats' }, 500)
  }
})

// Get customers
app.get('/make-server-cb9ae747/customers', async (c) => {
  const authResult = await requireAuth(c.req.raw)
  if (authResult.error) {
    return c.json({ error: authResult.error }, authResult.status)
  }
  
  try {
    const customers = await kv.getByPrefix('customer:')
    return c.json(customers)
  } catch (error) {
    console.log('Error fetching customers:', error)
    return c.json({ error: 'Failed to fetch customers' }, 500)
  }
})

// Create customer
app.post('/make-server-cb9ae747/customers', async (c) => {
  const authResult = await requireAuth(c.req.raw)
  if (authResult.error) {
    return c.json({ error: authResult.error }, authResult.status)
  }
  
  try {
    const customerData = await c.req.json()
    const customerId = `cust_${Date.now()}`
    
    const customer = {
      id: customerId,
      ...customerData,
      createdAt: new Date().toISOString()
    }
    
    await kv.set(`customer:${customerId}`, customer)
    return c.json(customer)
  } catch (error) {
    console.log('Error creating customer:', error)
    return c.json({ error: 'Failed to create customer' }, 500)
  }
})

// Get enquiries
app.get('/make-server-cb9ae747/enquiries', async (c) => {
  const authResult = await requireAuth(c.req.raw)
  if (authResult.error) {
    return c.json({ error: authResult.error }, authResult.status)
  }
  
  try {
    const enquiries = await kv.getByPrefix('enquiry:')
    return c.json(enquiries)
  } catch (error) {
    console.log('Error fetching enquiries:', error)
    return c.json({ error: 'Failed to fetch enquiries' }, 500)
  }
})

// Create enquiry
app.post('/make-server-cb9ae747/enquiries', async (c) => {
  const authResult = await requireAuth(c.req.raw)
  if (authResult.error) {
    return c.json({ error: authResult.error }, authResult.status)
  }
  
  try {
    const enquiryData = await c.req.json()
    const enquiryId = `enq_${Date.now()}`
    
    const enquiry = {
      id: enquiryId,
      ...enquiryData,
      status: 'New',
      createdAt: new Date().toISOString()
    }
    
    await kv.set(`enquiry:${enquiryId}`, enquiry)
    return c.json(enquiry)
  } catch (error) {
    console.log('Error creating enquiry:', error)
    return c.json({ error: 'Failed to create enquiry' }, 500)
  }
})

// Get quotations
app.get('/make-server-cb9ae747/quotations', async (c) => {
  const authResult = await requireAuth(c.req.raw)
  if (authResult.error) {
    return c.json({ error: authResult.error }, authResult.status)
  }
  
  try {
    const quotations = await kv.getByPrefix('quotation:')
    return c.json(quotations)
  } catch (error) {
    console.log('Error fetching quotations:', error)
    return c.json({ error: 'Failed to fetch quotations' }, 500)
  }
})

// Create quotation
app.post('/make-server-cb9ae747/quotations', async (c) => {
  const authResult = await requireAuth(c.req.raw)
  if (authResult.error) {
    return c.json({ error: authResult.error }, authResult.status)
  }
  
  try {
    const quotationData = await c.req.json()
    const quotationId = `quot_${Date.now()}`
    
    const quotation = {
      id: quotationId,
      ...quotationData,
      status: 'Draft',
      createdAt: new Date().toISOString()
    }
    
    await kv.set(`quotation:${quotationId}`, quotation)
    return c.json(quotation)
  } catch (error) {
    console.log('Error creating quotation:', error)
    return c.json({ error: 'Failed to create quotation' }, 500)
  }
})

// Update quotation status
app.put('/make-server-cb9ae747/quotations/:id/status', async (c) => {
  const authResult = await requireAuth(c.req.raw)
  if (authResult.error) {
    return c.json({ error: authResult.error }, authResult.status)
  }
  
  try {
    const quotationId = c.req.param('id')
    const { status, lostReason } = await c.req.json()
    
    const quotation = await kv.get(`quotation:${quotationId}`)
    if (!quotation) {
      return c.json({ error: 'Quotation not found' }, 404)
    }
    
    const updatedQuotation = {
      ...quotation,
      status,
      ...(status === 'Lost' && lostReason && { lostReason }),
      updatedAt: new Date().toISOString()
    }
    
    await kv.set(`quotation:${quotationId}`, updatedQuotation)
    return c.json(updatedQuotation)
  } catch (error) {
    console.log('Error updating quotation status:', error)
    return c.json({ error: 'Failed to update quotation status' }, 500)
  }
})

// Upload document
app.post('/make-server-cb9ae747/upload', async (c) => {
  const authResult = await requireAuth(c.req.raw)
  if (authResult.error) {
    return c.json({ error: authResult.error }, authResult.status)
  }
  
  try {
    const formData = await c.req.formData()
    const file = formData.get('file') as File
    const entityType = formData.get('entityType') as string
    const entityId = formData.get('entityId') as string
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400)
    }
    
    const fileName = `${entityType}/${entityId}/${Date.now()}_${file.name}`
    const fileBuffer = await file.arrayBuffer()
    
    const { data, error } = await supabase.storage
      .from('make-cb9ae747-documents')
      .upload(fileName, fileBuffer, {
        contentType: file.type
      })
    
    if (error) {
      console.log('Error uploading file:', error)
      return c.json({ error: 'Failed to upload file' }, 500)
    }
    
    // Create signed URL for the uploaded file
    const { data: signedUrl } = await supabase.storage
      .from('make-cb9ae747-documents')
      .createSignedUrl(fileName, 60 * 60 * 24) // 24 hours
    
    const document = {
      id: `doc_${Date.now()}`,
      entityType,
      entityId,
      fileName: file.name,
      filePath: fileName,
      fileSize: file.size,
      mimeType: file.type,
      uploadedAt: new Date().toISOString(),
      url: signedUrl?.signedUrl
    }
    
    await kv.set(`document:${document.id}`, document)
    
    return c.json(document)
  } catch (error) {
    console.log('Error in upload endpoint:', error)
    return c.json({ error: 'Internal server error during upload' }, 500)
  }
})

// Get documents for entity
app.get('/make-server-cb9ae747/documents/:entityType/:entityId', async (c) => {
  const authResult = await requireAuth(c.req.raw)
  if (authResult.error) {
    return c.json({ error: authResult.error }, authResult.status)
  }
  
  try {
    const entityType = c.req.param('entityType')
    const entityId = c.req.param('entityId')
    
    const allDocuments = await kv.getByPrefix('document:')
    const entityDocuments = allDocuments.filter(doc => 
      doc.entityType === entityType && doc.entityId === entityId
    )
    
    // Refresh signed URLs
    for (const doc of entityDocuments) {
      const { data: signedUrl } = await supabase.storage
        .from('make-cb9ae747-documents')
        .createSignedUrl(doc.filePath, 60 * 60 * 24)
      
      if (signedUrl) {
        doc.url = signedUrl.signedUrl
      }
    }
    
    return c.json(entityDocuments)
  } catch (error) {
    console.log('Error fetching documents:', error)
    return c.json({ error: 'Failed to fetch documents' }, 500)
  }
})

// Search functionality
app.get('/make-server-cb9ae747/search', async (c) => {
  const authResult = await requireAuth(c.req.raw)
  if (authResult.error) {
    return c.json({ error: authResult.error }, authResult.status)
  }
  
  try {
    const query = c.req.query('q')?.toLowerCase() || ''
    
    if (!query) {
      return c.json([])
    }
    
    const customers = await kv.getByPrefix('customer:')
    const enquiries = await kv.getByPrefix('enquiry:')
    const quotations = await kv.getByPrefix('quotation:')
    
    const results = []
    
    // Search customers
    customers.forEach(customer => {
      if (customer.customerName?.toLowerCase().includes(query) ||
          customer.email?.toLowerCase().includes(query)) {
        results.push({
          type: 'customer',
          id: customer.id,
          title: customer.customerName,
          subtitle: customer.email
        })
      }
    })
    
    // Search enquiries
    enquiries.forEach(enquiry => {
      if (enquiry.subject?.toLowerCase().includes(query) ||
          enquiry.customerName?.toLowerCase().includes(query)) {
        results.push({
          type: 'enquiry',
          id: enquiry.id,
          title: enquiry.subject,
          subtitle: `${enquiry.customerName} - ${enquiry.status}`
        })
      }
    })
    
    // Search quotations
    quotations.forEach(quotation => {
      if (quotation.customerName?.toLowerCase().includes(query)) {
        results.push({
          type: 'quotation',
          id: quotation.id,
          title: `Quotation #${quotation.quotationNumber}`,
          subtitle: `${quotation.customerName} - ${quotation.status}`
        })
      }
    })
    
    return c.json(results.slice(0, 10)) // Limit to 10 results
  } catch (error) {
    console.log('Error in search:', error)
    return c.json({ error: 'Search failed' }, 500)
  }
})

serve(app.fetch)