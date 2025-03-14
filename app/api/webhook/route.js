import { headers } from 'next/headers';
import Stripe from 'stripe';
import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

// Initialize Firebase Admin if not already initialized
const apps = getApps();
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

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Utility function to handle user updates
async function updateUserSubscription(userId, updates) {
  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();
  
  if (!userDoc.exists) {
    throw new Error(`User document not found for ID: ${userId}`);
  }

  await userRef.update({
    ...updates,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  console.log('Successfully updated user subscription:', { userId, ...updates });
}

export async function POST(req) {
  try {
    const body = await req.text();
    const headersList = headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('No Stripe signature found');
      return new Response(
        JSON.stringify({ error: 'No Stripe signature found' }), 
        { status: 400 }
      );
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('Missing STRIPE_WEBHOOK_SECRET');
      return new Response(
        JSON.stringify({ error: 'Webhook secret is not configured' }), 
        { status: 500 }
      );
    }

    // Verify the event
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('⚠️ Webhook signature verification failed:', err.message);
      return new Response(
        JSON.stringify({ error: `Webhook Error: ${err.message}` }), 
        { status: 400 }
      );
    }

    console.log('✓ Webhook verified. Processing event:', event.type);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('Processing checkout session:', {
          sessionId: session.id,
          customerId: session.customer,
          email: session.customer_email
        });

        const userId = session.metadata?.userId;
        if (!userId) {
          throw new Error('No userId found in session metadata');
        }

        await updateUserSubscription(userId, {
          subscriptionStatus: 'active',
          stripeCustomerId: session.customer,
          email: session.customer_email
        });

        console.log('✓ Successfully processed checkout session');
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        console.log('Processing subscription update:', {
          subscriptionId: subscription.id,
          status: subscription.status
        });

        const userId = subscription.metadata?.userId;
        if (!userId) {
          throw new Error('No userId found in subscription metadata');
        }

        await updateUserSubscription(userId, {
          subscriptionStatus: subscription.status === 'active' ? 'active' : 'inactive'
        });

        console.log('✓ Successfully processed subscription update');
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        console.log('Processing subscription deletion:', {
          subscriptionId: subscription.id
        });

        const userId = subscription.metadata?.userId;
        if (!userId) {
          throw new Error('No userId found in subscription metadata');
        }

        await updateUserSubscription(userId, {
          subscriptionStatus: 'inactive'
        });

        console.log('✓ Successfully processed subscription deletion');
        break;
      }

      default: {
        console.log(`Unhandled event type: ${event.type}`);
      }
    }

    return new Response(JSON.stringify({ received: true }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('❌ Error processing webhook:', err);
    return new Response(
      JSON.stringify({ error: err.message }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 