import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '../../../lib/firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req) {
  try {
    const body = await req.text();
    const headersList = headers();
    const signature = headersList.get('stripe-signature');

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    console.log('✓ Webhook verified, processing event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.client_reference_id;
        const customerId = session.customer;

        if (!userId || !customerId) {
          console.error('Missing userId or customerId in session:', session);
          return NextResponse.json(
            { error: 'Missing required data' },
            { status: 400 }
          );
        }

        // Update user document with Stripe customer ID and subscription status
        await db.collection('users').doc(userId).update({
          stripeCustomerId: customerId,
          subscriptionStatus: 'active',
          updatedAt: new Date()
        });

        console.log('✓ User updated with Stripe customer ID:', { userId, customerId });
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        // Find user with this customer ID
        const usersSnapshot = await db.collection('users')
          .where('stripeCustomerId', '==', customerId)
          .limit(1)
          .get();

        if (usersSnapshot.empty) {
          console.error('No user found with customer ID:', customerId);
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }

        const userDoc = usersSnapshot.docs[0];
        const status = subscription.status === 'active' ? 'active' : 'inactive';

        // Update subscription status
        await userDoc.ref.update({
          subscriptionStatus: status,
          updatedAt: new Date()
        });

        console.log('✓ Subscription status updated:', { userId: userDoc.id, status });
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('❌ Webhook error:', err.message);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
} 