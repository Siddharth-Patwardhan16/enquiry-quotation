# Dummy Data Generator Scripts

This directory contains scripts to generate dummy data for testing the Enquiry System application.

## Files

- `create-dummy-data.js` - Main script that creates all dummy data
- `run-dummy-data.js` - Simple runner script
- `README.md` - This documentation file

## What the Script Creates

The script creates a complete workflow with the following data:

### 1. Customer
- **TechCorp Industries Ltd.** - A manufacturing company with both office and plant locations
- Complete address information for both office (Mumbai) and plant (Pune)
- Purchase order references for various equipment types

### 2. Contact Person
- **Rajesh Kumar** - Procurement Manager
- Contact details and location information

### 3. Employee
- **Priya Sharma** - Marketing role employee
- Will be assigned as the marketing person for the enquiry

### 4. Enquiry
- **Graphite Heat Exchanger for Chemical Processing Plant**
- Detailed description and requirements
- High priority, website source
- Expected budget in Indian Rupees (₹)

### 5. Quotation
- **QT-2024-001** - Professional quotation number
- Detailed pricing breakdown including GST, transport, and insurance
- 30-day validity period
- Status: SUBMITTED

### 6. Quotation Items
- Graphite Heat Exchanger Core (₹20,00,000)
- Stainless Steel Frame & Supports (₹3,00,000)
- Control System & Instrumentation (₹5,00,000)

### 7. Communications
- **Initial Enquiry Discussion** - Telephonic communication
- **Technical Proposal Discussion** - Virtual meeting
- **Quotation Submission** - Email communication

## How to Run

### Option 1: Using npm/pnpm script (Recommended)
```bash
pnpm dummy-data
```

### Option 2: Direct Node.js execution
```bash
node scripts/run-dummy-data.js
```

### Option 3: Run the main script directly
```bash
node scripts/create-dummy-data.js
```

## Prerequisites

1. **Database Connection**: Ensure your database is running and accessible
2. **Environment Variables**: Make sure your `.env` file has the correct database connection string
3. **Prisma Client**: The Prisma client should be generated (`npx prisma generate`)

## Expected Output

The script will show progress for each step:

```
🚀 Starting to create dummy data...

📝 Creating dummy customer...
✅ Customer created: TechCorp Industries Ltd. (ID: uuid)

👤 Creating contact person...
✅ Contact created: Rajesh Kumar (ID: uuid)

👨‍💼 Creating employee...
✅ Employee created: Priya Sharma (ID: uuid)

📋 Creating enquiry...
✅ Enquiry created: Graphite Heat Exchanger for Chemical Processing Plant (ID: uuid)

💰 Creating quotation...
✅ Quotation created: QT-2024-001 (ID: uuid)

🔧 Creating quotation items...
✅ Created 3 quotation items

📞 Creating communications...
✅ Created 3 communications

🔄 Updating enquiry status...
✅ Enquiry status updated to QUOTED

📤 Updating quotation status...
✅ Quotation status updated to SUBMITTED

🎉 All dummy data created successfully!

📊 Summary:
   • Customer: TechCorp Industries Ltd.
   • Contact: Rajesh Kumar
   • Employee: Priya Sharma
   • Enquiry: Graphite Heat Exchanger for Chemical Processing Plant
   • Quotation: QT-2024-001
   • Communications: 3 records
   • Quotation Items: 3 items

🔗 You can now test the complete workflow in your application!
```

## Testing the Workflow

After running the script, you can test:

1. **Customer Management**: View the created customer in `/customers`
2. **Enquiry System**: Check the enquiry in `/enquiries`
3. **Quotation System**: View the quotation in `/quotations`
4. **Communication System**: See communications in `/communications`

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check your `.env` file
   - Ensure the database is running
   - Verify network connectivity

2. **Prisma Client Error**
   - Run `npx prisma generate` to regenerate the client
   - Check if the database schema is up to date

3. **Permission Errors**
   - Ensure the database user has CREATE permissions
   - Check if the database schema exists

### Reset Database

If you need to start fresh:

```bash
npx prisma db push --force-reset
pnpm dummy-data
```

## Customization

You can modify the `create-dummy-data.js` file to:

- Change customer details
- Modify enquiry requirements
- Adjust pricing
- Add more communication records
- Create multiple customers/enquiries

## Notes

- The script uses realistic Indian business data (addresses, phone numbers, currency)
- All monetary values are in Indian Rupees (₹)
- Dates are set relative to the current date
- The script handles errors gracefully and provides detailed feedback

