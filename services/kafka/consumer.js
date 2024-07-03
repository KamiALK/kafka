
import { Kafka } from 'kafkajs';

// Configuración de Kafka
const kafka = new Kafka({
  clientId: 'my-client-id',
  brokers: ['kafka:9092'],  // Ajusta la dirección del broker según tu configuración
});

// Creación del consumidor
const consumer = kafka.consumer({
  groupId: 'mygroup',
  sessionTimeout: 6000,
  heartbeatInterval: 3000,
  allowAutoTopicCreation: true,
  retry: {
    retries: 8
  }
});

// Función para inicializar y ejecutar el consumidor
const runConsumer = async () => {
  try {
    await consumer.connect();  // Conectar al broker Kafka

    // Suscripción al topic 'respuesta'
    await consumer.subscribe({ topic: 'respuesta', fromBeginning: true });

    // Función para manejar cada mensaje recibido
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        console.log({
          partition,
          offset: message.offset,
          value: message.value.toString(),
        });
        // Aquí puedes agregar la lógica adicional para procesar los mensajes recibidos
        // Por ejemplo, almacenar en una base de datos, enviar a otra API, etc.
      },
    });
  } catch (error) {
    console.error(`Error en runConsumer: ${error}`);
  }
};

// Función para desconectar el consumidor
const disconnectConsumer = async () => {
  try {
    await consumer.disconnect();
  } catch (error) {
    console.error(`Error en disconnectConsumer: ${error}`);
  }
};

export { runConsumer, disconnectConsumer };
