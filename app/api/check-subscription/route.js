import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const { customerId } = await request.json();

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: 'active'
    });

    return NextResponse.json({
      isActive: subscriptions.data.length > 0
    });
  } catch (error) {
    console.error('Error checking subscription:', error);
    return NextResponse.json({ error: 'Failed to check subscription status' }, { status: 500 });
  }
} 