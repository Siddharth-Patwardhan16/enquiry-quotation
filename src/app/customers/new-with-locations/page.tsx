import { CreateCustomerFormWithLocations } from '../_components/CreateCustomerFormWithLocations';

export default function NewCustomerWithLocationsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Customer</h1>
          <p className="mt-2 text-gray-600">
            Add a new customer with multiple offices and plants
          </p>
        </div>
        
        <CreateCustomerFormWithLocations />
      </div>
    </div>
  );
}


