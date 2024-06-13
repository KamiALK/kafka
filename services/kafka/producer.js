import { Kafka } from "kafkajs";
import dotenv from "dotenv";

dotenv.config();

const kafka = new Kafka({
  // brokers: ["localhost:9092"],
  brokers: ["kafka:9092"],
});
const producer = kafka.producer();

// Exporta la función sendKafkaMessage
export async function sendKafkaMessage(topic, message) {
  await producer.connect();
  await producer.send({
    topic,
    messages: [{ value: message }],
  });
  await producer.disconnect();
}
