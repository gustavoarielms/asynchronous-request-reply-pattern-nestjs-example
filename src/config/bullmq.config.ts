import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { config } from 'dotenv';

config();

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null
});

const queueName = process.env.REDIS_QUEUE || 'my-queue';
export const myQueue = new Queue(queueName, { connection });



export const myWorker = new Worker('my-queue', async (job: Job) => {
  const { params, method } = job.data;
  const externalMethod = eval(`(${method})`);

  console.log(params);

  let result = await externalMethod(params);

  return result;

}, { connection });

myWorker.on('completed', (job) => {
  console.log(`Job ${job.id} has been completed`);
});

myWorker.on('failed', (job, err) => {
  console.log(`Job ${job.id} has failed with ${err.message}`);
});