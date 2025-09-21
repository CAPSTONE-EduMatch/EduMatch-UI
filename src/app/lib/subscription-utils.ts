import { prismaClient } from '../../../prisma/index';

export async function handleSubscriptionCreation(userId: string, plan: string, stripeCustomerId?: string) {
  try {
    // Check if user already has a subscription
    const existingSubscription = await prismaClient.subscription.findFirst({
      where: { referenceId: userId }
    });

    if (existingSubscription) {
      // Update existing subscription
      return await prismaClient.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          plan,
          stripeCustomerId: stripeCustomerId || existingSubscription.stripeCustomerId,
          status: 'incomplete' // Will be updated by webhook
        }
      });
    } else {
      // Create new subscription
      return await prismaClient.subscription.create({
        data: {
          id: crypto.randomUUID(), // Generate a unique id for the subscription
          referenceId: userId,
          plan,
          stripeCustomerId,
          status: 'incomplete',
          cancelAtPeriodEnd: false,
          seats: 1
        }
      });
    }
  } catch (error) {
    console.error('Error handling subscription creation:', error);
    throw error;
  }
}
