import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Search for customer in Stripe
    const customers = await stripe.customers.list({
      email: email,
      limit: 1
    });

    if (customers.data.length === 0) {
      return NextResponse.json(
        { error: 'No customer found with this email' },
        { status: 404 }
      );
    }

    const customer = customers.data[0];
    
    // Get subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      limit: 1
    });

    return NextResponse.json({
      customerId: customer.id,
      email: customer.email,
      hasActiveSubscription: subscriptions.data.length > 0,
      subscriptionStatus: subscriptions.data[0]?.status || 'none'
    });
  } catch (error) {
    console.error('Error finding customer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 