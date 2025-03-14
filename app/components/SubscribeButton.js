import { useAuth } from '../../lib/context/AuthContext';

export default function SubscribeButton() {
  const { user } = useAuth();

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

  return (
    <button
      onClick={handleSubscribe}
      className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
    >
      Subscribe Now
    </button>
  );
} 