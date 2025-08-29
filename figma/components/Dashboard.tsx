import React from 'react'

export function Dashboard({ navigate, userProfile, accessToken, selectedId }) {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1>Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back, {userProfile?.name || 'User'}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-sm text-gray-600 mb-2">Total Customers</h3>
          <p className="text-2xl text-gray-900">24</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-sm text-gray-600 mb-2">Active Enquiries</h3>
          <p className="text-2xl text-gray-900">12</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-sm text-gray-600 mb-2">Pending Quotations</h3>
          <p className="text-2xl text-gray-900">8</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-sm text-gray-600 mb-2">Monthly Revenue</h3>
          <p className="text-2xl text-gray-900">$45,230</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <button 
          onClick={() => navigate('new-enquiry')}
          className="h-16 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          New Enquiry
        </button>
        <button 
          onClick={() => navigate('new-customer')}
          className="h-16 bg-white text-gray-700 border rounded-lg hover:bg-gray-50"
        >
          Add Customer
        </button>
        <button 
          onClick={() => navigate('enquiries')}
          className="h-16 bg-white text-gray-700 border rounded-lg hover:bg-gray-50"
        >
          View Enquiries
        </button>
        <button 
          onClick={() => navigate('quotations')}
          className="h-16 bg-white text-gray-700 border rounded-lg hover:bg-gray-50"
        >
          View Quotations
        </button>
      </div>

      {/* Enhanced Upcoming Tasks Section */}
      <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-0 shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800">Upcoming Tasks</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-sm font-semibold bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border border-blue-200 rounded-full">
              4 tasks pending
            </span>
            <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Task Summary */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-red-600 font-medium">1 overdue</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-blue-600 font-medium">3 upcoming</span>
          </div>
        </div>
        
        <div className="space-y-3">
          {/* Overdue Task */}
          <div className="group relative p-4 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl hover:shadow-md transition-all duration-200 cursor-pointer">
            <div className="absolute top-3 right-3">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg text-orange-600 bg-orange-50 border border-orange-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-sm mb-1">
                  Follow up on ABC Corp enquiry
                </h4>
                
                <p className="text-xs text-gray-600 mb-2 font-medium">
                  📍 ABC Corp
                </p>
                
                <p className="text-xs text-gray-600 mb-3">
                  Customer requested pricing for industrial pumps
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-red-500 to-red-600 text-white border-0 rounded">
                      high
                    </span>
                    <span className="px-2 py-1 text-xs bg-slate-100 text-slate-700 border border-slate-200 rounded">
                      pending
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-red-600 font-semibold">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>OVERDUE</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-red-200">
                  <div className="w-6 h-6 bg-gradient-to-r from-red-400 to-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    J
                  </div>
                  <span className="text-xs text-red-700 font-medium">
                    John Doe
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Upcoming Tasks */}
          <div className="group relative p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg text-purple-600 bg-purple-50 border border-purple-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-sm mb-1">
                  Submit quotation for XYZ Ltd
                </h4>
                
                <p className="text-xs text-gray-600 mb-2 font-medium">
                  📍 XYZ Ltd
                </p>
                
                <p className="text-xs text-gray-600 mb-3">
                  Technical specification review needed
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0 rounded">
                      medium
                    </span>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 border border-blue-200 rounded">
                      in-progress
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">Day after tomorrow</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    J
                  </div>
                  <span className="text-xs text-gray-600 font-medium">
                    Jane Smith
                  </span>
                </div>
              </div>
            </div>
            
            {/* Hover indicator */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
          
          <div className="group relative p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg text-emerald-600 bg-emerald-50 border border-emerald-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-sm mb-1">
                  Customer meeting with DEF Industries
                </h4>
                
                <p className="text-xs text-gray-600 mb-2 font-medium">
                  📍 DEF Industries
                </p>
                
                <p className="text-xs text-gray-600 mb-3">
                  Plant visit to discuss requirements
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0 rounded">
                      medium
                    </span>
                    <span className="px-2 py-1 text-xs bg-slate-100 text-slate-700 border border-slate-200 rounded">
                      pending
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">In 3 days</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    M
                  </div>
                  <span className="text-xs text-gray-600 font-medium">
                    Mike Johnson
                  </span>
                </div>
              </div>
            </div>
            
            {/* Hover indicator */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
          
          <div className="group relative p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg text-blue-600 bg-blue-50 border border-blue-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-sm mb-1">
                  Review pending enquiry from GHI Company
                </h4>
                
                <p className="text-xs text-gray-600 mb-2 font-medium">
                  📍 GHI Company
                </p>
                
                <p className="text-xs text-gray-600 mb-3">
                  New enquiry received, needs initial assessment
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-green-500 to-green-600 text-white border-0 rounded">
                      low
                    </span>
                    <span className="px-2 py-1 text-xs bg-slate-100 text-slate-700 border border-slate-200 rounded">
                      pending
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">In 4 days</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    S
                  </div>
                  <span className="text-xs text-gray-600 font-medium">
                    Sarah Wilson
                  </span>
                </div>
              </div>
            </div>
            
            {/* Hover indicator */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="pt-4 border-t border-gray-100">
          <button className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2 group">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            View All Tasks
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}