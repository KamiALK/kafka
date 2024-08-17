
import { Kafka } from 'kafkajs';

// Configuración de Kafka
const kafka = new Kafka({
  clientId: 'bot',
  brokers: ['kafka:9092'],  // Ajusta la dirección del broker según tu configuración
});

// Creación del consumidor
const consumer = kafka.consumer({
  groupId: '2',
  sessionTimeout: 6000,
  // heartbeatInterval: 3000,
  // allowAutoTopicCreation: true,
});

const runConsumer = async () => {
  try {
    await consumer.connect();  // Conectar al broker Kafka
    await consumer.subscribe({ topic: 'respuestas', fromBeginning: true});

    // Variable para almacenar el último mensaje recibido
    let lastMessage = null;

    // Crea una promesa que se resolverá cuando se reciba un mensaje o se agote el tiempo de espera
    const mensajePromise = new Promise((resolve, reject) => {
      // Temporizador para el tiempo máximo de espera (20 segundos)
      const timeout = setTimeout(() => {
        if (lastMessage !== null) {
          // Si se ha recibido al menos un mensaje, resuelve la promesa con el último mensaje
          resolve(lastMessage);
        } else {
          // Si no se ha recibido ningún mensaje, rechaza la promesa
          reject(new Error('Tiempo de espera agotado sin recibir mensajes'));
        }
        consumer.disconnect(); // Asegúrate de desconectar al final
      }, 20000); // 20,000 ms = 20 segundos

      consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            // Actualiza el último mensaje recibido
            console.log("el json")
            console.log(message.value.toString());
            const mensajeJson = JSON.parse(message.value.toString());
            lastMessage = mensajeJson.message; // Extrae el valor de la clave 'message'
            console.log(`Último mensaje recibido desde consumer: ${lastMessage}`);

            // Resuelve la promesa con el último mensaje y desconecta el consumidor
            clearTimeout(timeout); // Cancela el temporizador si se recibe un mensaje
            resolve(lastMessage);
            // await consumer.disconnect(); // Desconecta el consumidor
          } catch (error) {
            console.error("Error al analizar el mensaje JSON:", error);
            clearTimeout(timeout); // Cancela el temporizador en caso de error
            reject(error); // Rechaza la promesa en caso de error
            consumer.disconnect(); // Asegúrate de desconectar al final
          }
        }
      });
    });

    // Espera la resolución de la promesa
    return await mensajePromise;

  } catch (error) {
    console.error(`Error en runConsumer: ${error}`);
    return undefined; // Retorna undefined en caso de error o tiempo agotado
  }
};

const disconnectConsumer = async () => {
  try {
    await consumer.disconnect();
  } catch (error) {
    console.error(`Error en disconnectConsumer: ${error}`);
  }
};
export { runConsumer, disconnectConsumer };
