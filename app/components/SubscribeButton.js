import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '../../lib/context/AuthContext';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function SubscribeButton() {
  const { user } = useAuth();

  const handleSubscribe = async () => {
    try {
      const stripe = await stripePromise;
      
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

      const { sessionId } = await response.json();

      // Redirect to checkout
      const result = await stripe.redirectToCheckout({
        sessionId,
      });

      if (result.error) {
        console.error(result.error);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <button
      onClick={handleSubscribe}
      className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
    >
      Subscribe Now
    </button>
  );
} 