import { Queue } from "bullmq";

export function makeQueue(redisUrl: string, queueName: string) {
  return new Queue(queueName, { connection: { url: redisUrl } });
}
