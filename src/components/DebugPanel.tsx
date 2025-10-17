import React, { useState } from 'react';
import { useAuth } from '../App';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function DebugPanel() {
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, token } = useAuth();

  const runTests = async () => {
    setIsLoading(true);
    const results: any = {
      auth: {
        user: user ? 'Logged in' : 'Not logged in',
        token: token ? 'Token exists' : 'No token',
        tokenPreview: token ? token.substring(0, 20) + '...' : 'N/A'
      },
      apiTests: {}
    };

    try {
      // Test health endpoint
      console.log('Testing health endpoint...');
      const healthResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-1eecec3b/health`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      results.apiTests.health = {
        status: healthResponse.status,
        data: healthResponse.ok ? await healthResponse.json() : 'Failed'
      };

      // Test KV endpoint
      console.log('Testing KV endpoint...');
      const kvResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-1eecec3b/test-kv`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      results.apiTests.kv = {
        status: kvResponse.status,
        data: kvResponse.ok ? await kvResponse.json() : 'Failed'
      };

      // Test auth endpoint (if logged in)
      if (token) {
        console.log('Testing auth endpoint...');
        const authResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-1eecec3b/test-auth`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        results.apiTests.auth = {
          status: authResponse.status,
          data: authResponse.ok ? await authResponse.json() : await authResponse.text()
        };

        // Test bookings endpoint
        console.log('Testing bookings endpoint...');
        const bookingsResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-1eecec3b/user/bookings`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        results.apiTests.bookings = {
          status: bookingsResponse.status,
          data: bookingsResponse.ok ? await bookingsResponse.json() : await bookingsResponse.text()
        };

        // Test booking creation with a sample event
        console.log('Testing booking creation...');
        try {
          const testBookingResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-1eecec3b/events/1/book`, {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ quantity: 1 })
          });
          results.apiTests.testBooking = {
            status: testBookingResponse.status,
            data: testBookingResponse.ok ? await testBookingResponse.json() : await testBookingResponse.text()
          };
        } catch (bookingError) {
          results.apiTests.testBooking = {
            status: 'error',
            data: bookingError.message
          };
        }
      }

    } catch (error) {
      results.error = error.message;
    }

    setTestResults(results);
    setIsLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="mb-4 text-gray-900">Debug Panel</h3>
      
      <div className="mb-4">
        <button
          onClick={runTests}
          disabled={isLoading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isLoading ? 'Running Tests...' : 'Run API Tests'}
        </button>
      </div>

      {testResults && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="mb-2 text-gray-900">Test Results:</h4>
          <pre className="text-sm text-gray-700 overflow-auto max-h-96">
            {JSON.stringify(testResults, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}