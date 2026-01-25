import Bull from 'bull';
import { FundsTransferInput } from '../service/integrations/paystack.service';

// Initialize the queue with Redis
const transferQueue = new Bull('transferQueue', {
  redis: {
    host: '127.0.0.1',
    port: 6379,
  },
});

// Function to add a slack message job to the queue
export const sendTransferJob = (messageData: FundsTransferInput) => {
    transferQueue.add(messageData, {
        attempts: 5, // retry 5 times if job fails
        backoff: 30000, // wait 30 seconds before retrying
        removeOnComplete: 1000, // Keep the last 1000 completed jobs
        removeOnFail: 100, // Keep the last 100 failed jobs for review
    });
};

export default transferQueue;
