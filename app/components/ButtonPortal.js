'use client';

import { useAuth } from '../../lib/context/AuthContext';

export default function ButtonPortal() {
  const { user } = useAuth();

  const handlePortalSession = async () => {
    try {
      if (!user?.uid || !user?.email) {
        console.error('No user ID or email available');
        return;
      }

      // First, check Stripe for customer data
      const stripeResponse = await fetch('/api/debug-stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email
        }),
      });

      const stripeData = await stripeResponse.json();
      console.log('Stripe data:', stripeData);

      if (stripeData.error) {
        console.error('Error finding Stripe customer:', stripeData.error);
        return;
      }

      // Now check Firestore user data
      const checkResponse = await fetch('/api/check-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid
        }),
      });

      const userData = await checkResponse.json();
      console.log('User data:', userData);

      // If we have a Stripe customer but Firestore doesn't have the ID, update it
      if (stripeData.customerId && !userData.stripeCustomerId) {
        console.log('Updating Firestore with Stripe customer ID...');
        const updateResponse = await fetch('/api/update-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.uid,
            stripeCustomerId: stripeData.customerId
          }),
        });

        if (!updateResponse.ok) {
          console.error('Failed to update user with Stripe customer ID');
          return;
        }
      }

      // Finally, create the portal session
      const response = await fetch('/api/billing/create-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid
        }),
      });

      const data = await response.json();
      console.log('Portal response:', data);

      if (!response.ok) {
        console.error('Error creating portal session:', data.error);
        return;
      }

      if (!data.url) {
        console.error('No URL received from server');
        return;
      }

      window.location.href = data.url;
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <button
      onClick={handlePortalSession}
      className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors text-sm"
    >
      Manage Subscription
    </button>
  );
} 