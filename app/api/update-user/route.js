import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase-admin';

export async function POST(request) {
  try {
    const { userId, stripeCustomerId } = await request.json();

    if (!userId || !stripeCustomerId) {
      return NextResponse.json(
        { error: 'User ID and Stripe customer ID are required' },
        { status: 400 }
      );
    }

    // Update user document with Stripe customer ID
    await db.collection('users').doc(userId).update({
      stripeCustomerId: stripeCustomerId,
      updatedAt: new Date()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 