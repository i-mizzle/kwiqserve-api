import Bull from 'bull';
import { FundsTransferInput } from '../service/integrations/paystack.service';
import { PendingFeeDocument } from '../model/pending-fee.model';

// Initialize the queue with Redis
const transferQueue = new Bull('transferQueue', {
  redis: {
    host: '127.0.0.1',
    port: 6379,
  },
});

export interface FundsTransferInterface extends FundsTransferInput {
  pendingFeesApplied: PendingFeeDocument['_id']
}

// Function to add a slack message job to the queue
export const sendTransferJob = (messageData: FundsTransferInterface) => {
    transferQueue.add(messageData, {
        attempts: 5, // retry 5 times if job fails
        backoff: 30000, // wait 30 seconds before retrying
        removeOnComplete: 1000, // Keep the last 1000 completed jobs
        removeOnFail: 100, // Keep the last 100 failed jobs for review
    });
};

export default transferQueue;
