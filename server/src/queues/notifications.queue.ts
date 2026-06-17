import { Queue, Worker, Job } from 'bullmq';
import { redisCache } from '../redis/client';

type NotificationJob = {
  userId: string;
  message: string;
  conversationId: string;
};

export const notificationQueue = new Queue<NotificationJob>('notifications', {
  connection: redisCache as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
  }
});

export const notificationWorker = new Worker<NotificationJob>(
  'notifications',
  async (job: Job<NotificationJob>) => {
    console.log(`Processing notification job ${job.id}`);
    const { userId, message, conversationId } = job.data;
    // TODO: send push notification via FCM or Web Push API
    console.log(`Notifying user ${userId}: ${message}`);
  },
  { connection: redisCache as any, concurrency: 5 }
);

notificationWorker.on('completed', job => console.log(`Job ${job.id} done`));
notificationWorker.on('failed', (job, err) => console.error(`Job ${job?.id} failed:`, err));
