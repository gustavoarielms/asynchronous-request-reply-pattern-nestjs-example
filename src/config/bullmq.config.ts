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

const queueName = 'my-queue';
export const myQueue = new Queue(queueName, { connection });

export const myWorker = new Worker(queueName, async (job: Job) => {
  // Lógica para procesar la tarea
  const data = job.data;
  await new Promise(resolve => setTimeout(resolve, 5000)); // Simula un retraso de 5 segundos
  return `processed: ${data}`;
}, { connection });

myWorker.on('completed', (job) => {
  console.log(`Job ${job.id} has been completed`);
});

myWorker.on('failed', (job, err) => {
  console.log(`Job ${job.id} has failed with ${err.message}`);
});