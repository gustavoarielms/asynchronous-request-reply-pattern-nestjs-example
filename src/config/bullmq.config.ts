import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis({
  host: '127.0.0.1', // Cambia esto si usas un host diferente
  port: 6379,        // Cambia esto si usas un puerto diferente
  maxRetriesPerRequest: null
});

const queueName = 'my-queue';
export const myQueue = new Queue(queueName, { connection });

export const myWorker = new Worker(queueName, async (job: Job) => {
  // Lógica para procesar la tarea
  const data = job.data;
  return `Processed: ${data}`;
}, { connection });

myWorker.on('completed', (job) => {
  console.log(`Job ${job.id} has been completed`);
});

myWorker.on('failed', (job, err) => {
  console.log(`Job ${job.id} has failed with ${err.message}`);
});