'use client';

import { useEffect } from 'react';
import { useAuth } from '../../lib/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function SubscribePage() {
  const { user, subscriptionStatus, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth');
      } else if (subscriptionStatus === 'active') {
        router.push('/dashboard');
      }
    }
  }, [user, subscriptionStatus, loading, router]);

  const handleSubscribe = async () => {
    try {
      // Create a checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user?.email,
          userId: user?.uid
        }),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error('Server returned non-JSON response:', await response.text());
        return;
      }

      const data = await response.json();
      console.log('Server response:', data);

      if (!response.ok) {
        console.error('Server error:', data.error);
        return;
      }

      if (data.error) {
        console.error('Error creating checkout session:', data.error);
        return;
      }

      // Redirect to the checkout URL
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('No URL received from server:', data);
      }
    } catch (error) {
      console.error('Error in handleSubscribe:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in to subscribe</h1>
          <a href="/auth" className="text-blue-600 hover:text-blue-800">Go to Sign In</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Upgrade to Premium</h2>
          <p className="text-gray-600 mb-8">
            Get access to all premium features and start tracking your nutrition goals today!
          </p>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <h3 className="text-lg font-semibold mb-4">Premium Features:</h3>
          <ul className="space-y-3">
            <li className="flex items-center">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Unlimited meal tracking
            </li>
            <li className="flex items-center">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Advanced analytics
            </li>
            <li className="flex items-center">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Custom meal plans
            </li>
          </ul>
        </div>

        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 mb-4">€5.99<span className="text-lg text-gray-600">/month</span></p>
          <button
            onClick={handleSubscribe}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors"
          >
            Subscribe Now
          </button>
        </div>
      </div>
    </div>
  );
} 