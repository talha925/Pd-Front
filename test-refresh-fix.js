// Test script to verify refresh bug fix
// Run this in browser console on your pages

console.log('🧪 Testing Refresh Bug Fix...');

// Test 1: Check if data is loaded
function testDataLoading() {
  console.log('📊 Test 1: Data Loading');
  
  // Check for stores data
  const storeElements = document.querySelectorAll('[data-testid="store-card"], .store-card, [class*="store"]');
  console.log(`Found ${storeElements.length} store elements`);
  
  // Check for categories data
  const categoryElements = document.querySelectorAll('[data-testid="category-card"], .category-card, [class*="category"]');
  console.log(`Found ${categoryElements.length} category elements`);
  
  // Check for loading states
  const loadingElements = document.querySelectorAll('[data-testid="loading"], .loading, [class*="loading"]');
  console.log(`Found ${loadingElements.length} loading elements`);
  
  // Check for error states
  const errorElements = document.querySelectorAll('[data-testid="error"], .error, [class*="error"]');
  console.log(`Found ${errorElements.length} error elements`);
  
  return {
    stores: storeElements.length,
    categories: categoryElements.length,
    loading: loadingElements.length,
    errors: errorElements.length
  };
}

// Test 2: Check auth context
function testAuthContext() {
  console.log('🔐 Test 2: Auth Context');
  
  // Check localStorage for auth data
  const authToken = localStorage.getItem('authToken');
  const user = localStorage.getItem('user');
  
  console.log('Auth token exists:', !!authToken);
  console.log('User data exists:', !!user);
  
  if (user) {
    try {
      const userData = JSON.parse(user);
      console.log('User data:', userData);
    } catch (e) {
      console.log('Invalid user data in localStorage');
    }
  }
  
  return {
    hasToken: !!authToken,
    hasUser: !!user
  };
}

// Test 3: Check network requests
function testNetworkRequests() {
  console.log('🌐 Test 3: Network Requests');
  
  // Get performance entries
  const entries = performance.getEntriesByType('resource');
  const apiRequests = entries.filter(entry => 
    entry.name.includes('/api/') || 
    entry.name.includes('proxy-stores') || 
    entry.name.includes('proxy-categories')
  );
  
  console.log(`Found ${apiRequests.length} API requests`);
  apiRequests.forEach((request, index) => {
    console.log(`Request ${index + 1}:`, {
      url: request.name,
      duration: `${request.duration.toFixed(2)}ms`,
      status: request.transferSize > 0 ? 'Success' : 'Failed'
    });
  });
  
  return apiRequests.length;
}

// Test 4: Check console logs
function testConsoleLogs() {
  console.log('📝 Test 4: Console Logs');
  
  // Check for auth context logs
  const authLogs = [
    '[AuthContext] Starting auth initialization',
    '[AuthContext] Auth initialized successfully',
    '[AuthContext] Auth initialization complete'
  ];
  
  // Check for data fetching logs
  const fetchLogs = [
    '[useAuthAwareDataFetching] Fetch',
    '[useAuthAwareDataFetching] Successfully fetched'
  ];
  
  console.log('Look for these auth logs in console:');
  authLogs.forEach(log => console.log(`  - ${log}`));
  
  console.log('Look for these fetch logs in console:');
  fetchLogs.forEach(log => console.log(`  - ${log}`));
  
  return { authLogs, fetchLogs };
}

// Run all tests
function runAllTests() {
  console.log('🚀 Running all tests...\n');
  
  const results = {
    data: testDataLoading(),
    auth: testAuthContext(),
    network: testNetworkRequests(),
    logs: testConsoleLogs()
  };
  
  console.log('\n📋 Test Results:');
  console.log('Data Loading:', results.data);
  console.log('Auth Context:', results.auth);
  console.log('Network Requests:', results.network);
  
  // Summary
  const hasData = results.data.stores > 0 || results.data.categories > 0;
  const hasAuth = results.auth.hasToken || results.auth.hasUser;
  const hasRequests = results.network > 0;
  
  console.log('\n✅ Summary:');
  console.log(`Data loaded: ${hasData ? '✅' : '❌'}`);
  console.log(`Auth working: ${hasAuth ? '✅' : '❌'}`);
  console.log(`API requests: ${hasRequests ? '✅' : '❌'}`);
  
  if (hasData && hasRequests) {
    console.log('\n🎉 Refresh bug fix appears to be working!');
  } else {
    console.log('\n⚠️ Some issues detected. Check the logs above.');
  }
  
  return results;
}

// Auto-run tests
runAllTests();

// Export for manual testing
window.testRefreshFix = {
  testDataLoading,
  testAuthContext,
  testNetworkRequests,
  testConsoleLogs,
  runAllTests
}; 