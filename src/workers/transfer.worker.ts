import dotenv from 'dotenv'
dotenv.config()

import log from '../logger';
import { generateAndUploadQRCode } from '../service/qrcode.service';
import transferQueue from '../queues/transfer.queue';

log.info('transfer worker started. waiting for jobs...')

// Process the transfer jobs from the queue
transferQueue.process(async (job: any) => {
  try {
    console.log('.....................................................................')
    console.log('Processing transfer job: ', job.id, job.data)
    const qrCodeUrl = await generateAndUploadQRCode(job.data.storeId, job.data.data)

    log.info(`transfer sent for ${job.data.paystackRecipientCode}: ${job.data.amount}`);
  } catch (error) {
    log.error(`transfer failed to send to ${job.data.storeFrontUrl}: `, error);
    throw error; // Allows Bull to handle retries and logging
  }
});
