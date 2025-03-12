import { headers } from 'next/headers';
import Stripe from 'stripe';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc, query, collection, where, getDocs } from 'firebase/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  const body = await req.text();
  const signature = headers().get('stripe-signature');
  console.log('Received webhook with signature:', signature);

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log('Webhook event type:', event.type);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('Checkout session completed:', {
          customer: session.customer,
          metadata: session.metadata,
          email: session.customer_email
        });
        
        // Get the userId from metadata
        const userId = session.metadata?.userId;
        if (!userId) {
          console.error('No userId found in session metadata');
          return new Response(JSON.stringify({ error: 'No userId found' }), { status: 400 });
        }

        // Update user's subscription status in Firestore
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          console.error('User document not found');
          return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
        }

        console.log('Updating subscription status for user:', userId);
        await updateDoc(userRef, {
          subscriptionStatus: 'active',
          stripeCustomerId: session.customer,
          updatedAt: new Date()
        });
        console.log('Successfully updated subscription status to active');
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        
        // Get the userId from metadata
        const userId = subscription.metadata?.userId;
        if (!userId) {
          console.error('No userId found in subscription metadata');
          return new Response(JSON.stringify({ error: 'No userId found' }), { status: 400 });
        }

        // Update user's subscription status
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          subscriptionStatus: subscription.status === 'active' ? 'active' : 'inactive',
          updatedAt: new Date()
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
        // Get the userId from metadata
        const userId = subscription.metadata?.userId;
        if (!userId) {
          console.error('No userId found in subscription metadata');
          return new Response(JSON.stringify({ error: 'No userId found' }), { status: 400 });
        }

        // Update user's subscription status to inactive
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          subscriptionStatus: 'inactive',
          updatedAt: new Date()
        });
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err) {
    console.error('Error processing webhook:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
} 