# 📖 User Manual - CRM Portal

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Customer Management](#customer-management)
4. [Enquiry Management](#enquiry-management)
5. [Quotation Management](#quotation-management)
6. [Communication Tracking](#communication-tracking)
7. [Task Management](#task-management)
8. [User Management](#user-management)
9. [Reports & Analytics](#reports--analytics)
10. [Troubleshooting](#troubleshooting)

---

## 🚀 Getting Started

### First Login

1. **Access the System**
   - Open your web browser
   - Navigate to the CRM Portal URL
   - You'll see the login page

2. **Login Process**
   - Enter your email address
   - Enter your password
   - Click "Sign In"
   - You'll be redirected to the dashboard

3. **Understanding Your Role**
   - **Administrator**: Full system access
   - **Marketing**: Customer and enquiry management
   - **Sales**: Quotation management
   - **Support**: Communication tracking

### Navigation Overview

The main navigation is located on the left sidebar:

- 🏠 **Dashboard** - Overview and analytics
- 👥 **Customers** - Customer management
- 📋 **Enquiries** - Enquiry tracking
- 📄 **Quotations** - Quotation management
- 💬 **Communications** - Communication tracking
- ✅ **Tasks** - Task and meeting management
- ⚙️ **Settings** - User preferences
- 👤 **Admin** - User management (Administrators only)

---

## 📊 Dashboard Overview

The dashboard provides a comprehensive overview of your business performance.

### Key Metrics

1. **Total Customers** - Number of active customers
2. **Total Enquiries** - Number of customer enquiries
3. **Total Quotations** - Number of quotations created
4. **Deals Won** - Number of successful deals

### Charts and Analytics

1. **Monthly Trends Chart**
   - Shows enquiry trends over time
   - Helps identify seasonal patterns
   - Useful for business planning

2. **Lost Reasons Chart**
   - Displays reasons for lost quotations
   - Helps improve future quotations
   - Identifies common issues

3. **Quotation Value vs Live Chart**
   - Compares quotation values with live deals
   - Shows conversion rates
   - Helps with pricing strategies

### Recent Activity

- **Recent Enquiries** - Latest customer enquiries
- **Recent Quotations** - Recently created quotations
- Quick access to detailed views

---

## 👥 Customer Management

### Creating a New Customer

1. **Navigate to Customers**
   - Click "Customers" in the sidebar
   - Click "New Customer" button

2. **Basic Information**
   - **Customer Name** (Required): Enter the company name
   - **Is New Customer**: Check if this is a new customer

3. **Office Information**
   - **Office Name** (Required): e.g., "Head Office", "Regional Office"
   - **Address**: Complete office address
   - **City/Town**: Office city
   - **State**: Office state (dropdown for India)
   - **Country**: Office country (default: India)
   - **Reception Number**: Main office phone number

4. **Plant Information** (Optional)
   - **Plant Name**: Manufacturing facility name
   - **Address**: Plant address
   - **City/Town**: Plant city
   - **State**: Plant state
   - **Country**: Plant country
   - **Reception Number**: Plant phone number

5. **Purchase Order Information**
   - Check the types of POs received:
     - ☑️ Rupture Discs
     - ☑️ Thermowells
     - ☑️ Heat Exchanger
     - ☑️ Miscellaneous
     - ☑️ Water Jet / Steam Jet Ejector

6. **Additional Information**
   - **Existing Graphite Suppliers**: Current suppliers
   - **Problems Faced**: Any issues reported by customer

7. **Save Customer**
   - Click "Create Customer"
   - You'll be redirected to the customers list

### Managing Customer Information

1. **View Customer Details**
   - Click on a customer name in the customers list
   - View all customer information and related data

2. **Edit Customer**
   - Click the edit button (pencil icon)
   - Modify any information
   - Click "Update Customer"

3. **Add Contacts**
   - In customer details, click "Add Contact"
   - Fill in contact person details:
     - Name (Required)
     - Designation
     - Official cell number
     - Personal cell number
     - Location assignment

4. **Add Locations**
   - Click "Add Location"
   - Choose location type (Office or Plant)
   - Fill in location details
   - Save the location

### Customer Search and Filtering

- **Search**: Use the search bar to find customers by name
- **Filter**: Filter by customer type or status
- **Sort**: Sort by name, creation date, or last updated

---

## 📋 Enquiry Management

### Creating a New Enquiry

1. **Navigate to Enquiries**
   - Click "Enquiries" in the sidebar
   - Click "New Enquiry" button

2. **Customer Selection**
   - **Customer**: Select from existing customers
   - **Location**: Choose office or plant location
   - **Contact Person**: Select contact person

3. **Enquiry Details**
   - **Description** (Required): Detailed enquiry description
   - **Priority**: Choose from Low, Medium, High
   - **Source**: How the enquiry was received
   - **Expected Budget**: Customer's budget range

4. **Assignment**
   - **Marketing Person**: Assign to a team member
   - This person will be responsible for follow-up

5. **Save Enquiry**
   - Click "Create Enquiry"
   - The enquiry will appear in the enquiries list

### Managing Enquiries

1. **View Enquiry Details**
   - Click on an enquiry in the list
   - View all enquiry information
   - See related quotations and communications

2. **Update Enquiry Status**
   - **Open**: Initial enquiry state
   - **In Progress**: Being actively worked on
   - **Closed**: Completed or cancelled

3. **Link Communications**
   - Record all customer interactions
   - Link communications to specific enquiries
   - Track follow-up actions

4. **Create Quotations**
   - From enquiry details, click "Create Quotation"
   - This will pre-populate customer information

### Enquiry Workflow

```
New Enquiry → In Progress → Quotation Created → Won/Lost
     ↓              ↓              ↓
Communications → Follow-ups → Final Decision
```

---

## 📄 Quotation Management

### Creating a New Quotation

1. **Navigate to Quotations**
   - Click "Quotations" in the sidebar
   - Click "New Quotation" button

2. **Enquiry Selection**
   - **Select Enquiry**: Choose the related enquiry
   - Customer information will be auto-populated

3. **Quotation Header**
   - **Quotation Number** (Required): Unique quotation number
   - **Revision Number**: Version number (default: 0)
   - **Quotation Date**: Date of quotation
   - **Valid Until**: Quotation validity period
   - **Currency**: INR, USD, EUR, etc.

4. **Terms and Conditions**
   - **Payment Terms**: e.g., "30 days from invoice date"
   - **Delivery Schedule**: e.g., "4-6 weeks from order"
   - **Special Instructions**: Any special terms or notes

5. **Line Items**
   - Click "Add Item" for each product/service
   - **Material Description** (Required): Product description
   - **Specifications**: Technical specifications
   - **Quantity** (Required): Number of units
   - **Unit Price** (Required): Price per unit
   - **Total**: Automatically calculated

6. **Review Totals**
   - **Subtotal**: Sum of all line items
   - **Tax**: 10% GST (automatically calculated)
   - **Total Value**: Final amount including tax

7. **Save Quotation**
   - Click "Create Quotation"
   - Status will be set to "Draft"

### Managing Quotations

1. **View Quotation Details**
   - Click on a quotation in the list
   - View complete quotation information
   - See all line items and totals

2. **Edit Quotation**
   - Click "Edit Quotation" button
   - Modify any information
   - Add or remove line items
   - Click "Save Changes"

3. **Update Quotation Status**
   - **Draft**: Initial state, can be modified
   - **Live**: Sent to customer, can be modified
   - **Submitted**: Formally submitted, limited changes
   - **Won**: Customer accepted the quotation
   - **Lost**: Customer rejected the quotation
   - **Received**: Purchase order received

4. **Status Change Workflow**
   ```
   Draft → Live → Submitted → Won/Lost
                        ↓
                   Received (with PO)
   ```

5. **Export PDF**
   - Click "Export PDF" button
   - Professional quotation will be generated
   - Download and send to customer

6. **Delete Quotation**
   - Click delete button (trash icon)
   - Confirm deletion
   - **Warning**: This action cannot be undone

### Quotation Best Practices

1. **Numbering Convention**
   - Use consistent numbering: QT-2024-001, QT-2024-002
   - Include year and sequential number

2. **Line Item Details**
   - Provide clear descriptions
   - Include technical specifications
   - Use appropriate units of measurement

3. **Pricing Strategy**
   - Consider market rates
   - Include all costs (materials, labor, overhead)
   - Add appropriate profit margins

4. **Terms and Conditions**
   - Clear payment terms
   - Realistic delivery schedules
   - Include warranty information

---

## 💬 Communication Tracking

### Recording Communications

1. **Navigate to Communications**
   - Click "Communications" in the sidebar
   - Click "New Communication" button

2. **Customer Information**
   - **Customer**: Select customer
   - **Contact Person**: Choose specific contact
   - **Enquiry Related**: Link to specific enquiry (optional)

3. **Communication Details**
   - **Subject** (Required): Brief subject line
   - **General Description**: Context or background
   - **Brief Description** (Required): Main communication content

4. **Communication Type**
   - **Telephonic Discussion**: Phone calls
   - **Virtual Meeting**: Online meetings
   - **Email**: Email communications
   - **Plant Visit**: On-site plant visits
   - **Office Visit**: Office meetings

5. **Follow-up Planning**
   - **Next Communication Date**: When to follow up
   - **Proposed Mode**: How to follow up

6. **Save Communication**
   - Click "Create Communication"
   - Record will appear in communications list

### Managing Communications

1. **View All Communications**
   - Chronological list of all communications
   - Search by customer, subject, or content
   - Filter by communication type

2. **Communication Details**
   - Click on any communication to view details
   - See related customer and enquiry information
   - Track follow-up actions

3. **Search and Filter**
   - **Search**: Find communications by content
   - **Filter by Type**: Phone, email, meeting, visit
   - **Filter by Customer**: View all communications for a customer
   - **Date Range**: Filter by communication date

4. **Follow-up Management**
   - View pending follow-ups
   - Mark follow-ups as completed
   - Reschedule follow-up dates

### Communication Best Practices

1. **Timely Recording**
   - Record communications immediately after they occur
   - Include all relevant details
   - Note any action items

2. **Clear Descriptions**
   - Use clear, professional language
   - Include key decisions made
   - Note any commitments or promises

3. **Follow-up Planning**
   - Always set next communication date
   - Choose appropriate communication method
   - Follow through on commitments

---

## ✅ Task Management

### Meeting Management

1. **Schedule Meetings**
   - Go to Tasks → Meeting Management
   - Click "Schedule Meeting"
   - Fill in meeting details:
     - Customer and contact
     - Meeting date and time
     - Meeting type (in-person, virtual)
     - Agenda items
     - Expected outcomes

2. **Meeting Preparation**
   - Review customer history
   - Prepare relevant documents
   - Set meeting objectives
   - Prepare questions to ask

3. **Post-Meeting Actions**
   - Record meeting outcomes
   - Update enquiry status if needed
   - Schedule follow-up actions
   - Send meeting summary to customer

### Quotation Status Management

1. **Status Tracking**
   - Monitor quotation status changes
   - Set reminders for follow-ups
   - Track customer responses
   - Update status as needed

2. **Follow-up Reminders**
   - Set automatic reminders
   - Track overdue follow-ups
   - Escalate if needed
   - Maintain customer relationships

### Task Workflow

```
Task Created → Assigned → In Progress → Completed
     ↓            ↓           ↓           ↓
Reminders → Follow-ups → Updates → Documentation
```

---

## 👤 User Management (Administrators Only)

### Managing Users

1. **Access User Management**
   - Click "Admin" in the sidebar
   - View all system users
   - Manage user roles and permissions

2. **Add New Users**
   - Click "Add User"
   - Fill in user details:
     - Name and email
     - Role assignment
     - Initial permissions
   - Send invitation email

3. **Edit User Information**
   - Click on user name
   - Modify user details
   - Change role or permissions
   - Update contact information

4. **User Roles**
   - **Administrator**: Full system access
   - **Marketing**: Customer and enquiry management
   - **Sales**: Quotation management
   - **Support**: Communication tracking

### Role Permissions

| Feature | Admin | Marketing | Sales | Support |
|---------|-------|-----------|-------|---------|
| User Management | ✅ | ❌ | ❌ | ❌ |
| Customer Management | ✅ | ✅ | ✅ | ✅ |
| Enquiry Management | ✅ | ✅ | ❌ | ✅ |
| Quotation Management | ✅ | ✅ | ✅ | ❌ |
| Communication Tracking | ✅ | ✅ | ✅ | ✅ |
| Reports & Analytics | ✅ | ✅ | ✅ | ❌ |

---

## 📈 Reports & Analytics

### Dashboard Analytics

1. **Key Performance Indicators**
   - Total customers
   - Active enquiries
   - Quotation conversion rates
   - Revenue tracking

2. **Trend Analysis**
   - Monthly enquiry trends
   - Seasonal patterns
   - Growth indicators
   - Performance comparisons

3. **Lost Quotation Analysis**
   - Reasons for lost deals
   - Common issues
   - Improvement opportunities
   - Competitive analysis

### Custom Reports

1. **Customer Reports**
   - Customer activity summary
   - Communication history
   - Quotation history
   - Revenue per customer

2. **Enquiry Reports**
   - Enquiry source analysis
   - Conversion rates
   - Response times
   - Success factors

3. **Quotation Reports**
   - Quotation performance
   - Win/loss analysis
   - Pricing analysis
   - Delivery performance

### Export Options

- **PDF Reports**: Professional formatted reports
- **Excel Export**: Data for further analysis
- **Email Reports**: Automated report delivery
- **Scheduled Reports**: Regular report generation

---

## 🔧 Troubleshooting

### Common Issues

#### Login Problems
**Problem**: Cannot log in to the system
**Solutions**:
1. Check email and password
2. Clear browser cache and cookies
3. Try a different browser
4. Contact system administrator

#### Slow Performance
**Problem**: System is running slowly
**Solutions**:
1. Check internet connection
2. Close unnecessary browser tabs
3. Clear browser cache
4. Try refreshing the page

#### Data Not Saving
**Problem**: Changes are not being saved
**Solutions**:
1. Check internet connection
2. Ensure all required fields are filled
3. Try refreshing and re-entering data
4. Contact technical support

#### PDF Export Issues
**Problem**: Cannot export PDF quotations
**Solutions**:
1. Check browser compatibility
2. Ensure quotation is complete
3. Try a different browser
4. Contact technical support

### Getting Help

1. **System Help**
   - Check this user manual
   - Look for help icons in the interface
   - Review error messages carefully

2. **Technical Support**
   - Contact your system administrator
   - Report issues with detailed descriptions
   - Include screenshots if possible

3. **Training**
   - Request additional training sessions
   - Review system documentation
   - Practice with test data

### Best Practices

1. **Data Entry**
   - Always fill required fields
   - Use consistent formatting
   - Double-check important information
   - Save work frequently

2. **Security**
   - Log out when finished
   - Use strong passwords
   - Don't share login credentials
   - Report suspicious activity

3. **Backup**
   - Export important data regularly
   - Keep local copies of critical quotations
   - Document important decisions
   - Maintain communication records

---

## 📞 Support Contacts

- **Technical Support**: [support-email]
- **System Administrator**: [admin-email]
- **Training Coordinator**: [training-email]
- **Emergency Contact**: [emergency-phone]

---

*This user manual is designed to help you make the most of the CRM Portal. For additional assistance, please contact your system administrator or technical support team.*

