import Stripe from 'stripe';
import { headers } from 'next/headers';
import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
const apps = admin.apps;
if (!apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    })
  });
}

const db = admin.firestore();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    // Validate request body
    const body = await req.json();
    const { email, userId } = body;

    if (!userId || !email) {
      return new Response(
        JSON.stringify({ 
          error: 'Both user ID and email are required' 
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if user already has an active subscription using admin SDK
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      
      if (userData.stripeCustomerId) {
        // Check if customer has any active subscriptions
        const subscriptions = await stripe.subscriptions.list({
          customer: userData.stripeCustomerId,
          status: 'active',
          limit: 1
        });

        if (subscriptions.data.length > 0) {
          // User already has an active subscription, return billing portal URL instead
          const portalSession = await stripe.billingPortal.sessions.create({
            customer: userData.stripeCustomerId,
            return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
          });

          return new Response(
            JSON.stringify({ 
              url: portalSession.url,
              isExistingSubscriber: true
            }), 
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
      }
    }

    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_STRIPE_PRICE_ID) {
      throw new Error('Missing NEXT_PUBLIC_STRIPE_PRICE_ID');
    }

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      throw new Error('Missing NEXT_PUBLIC_APP_URL');
    }

    console.log('Creating checkout session for:', { userId, email });

    // Create the checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true&subscription_active=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscribe?canceled=true`,
      customer_email: email,
      client_reference_id: userId,
      metadata: {
        userId: userId
      },
      subscription_data: {
        metadata: {
          userId: userId
        }
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      payment_method_collection: 'if_required'
    });

    console.log('✓ Checkout session created:', { 
      sessionId: session.id, 
      userId, 
      email 
    });

    return new Response(
      JSON.stringify({ 
        url: session.url
      }), 
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (err) {
    console.error('❌ Error creating checkout session:', err);
    return new Response(
      JSON.stringify({ 
        error: err.message 
      }), 
      {
        status: err.statusCode || 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
} 