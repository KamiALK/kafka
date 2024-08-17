import "dotenv/config";
import bot from "@bot-whatsapp/bot";
import { getDay } from "date-fns";
import QRPortalWeb from "@bot-whatsapp/portal";
import BaileysProvider from "@bot-whatsapp/provider/baileys";
import MockAdapter from "@bot-whatsapp/database/mock";

// import chatgpt from "./services/openai/chatgpt.js";
// import GoogleSheetService from "./services/sheets/index.js";

// const googelSheet = new GoogleSheetService(
//   "1pcBkWWa0x-q-mwV54bRMOixjCv-tFVvLSrzGPsPPQgQ",
// );

import { sendKafkaMessage } from "./services/kafka/producer.js"
import { runConsumer  } from "./services/kafka/consumer.js";
import { disconnectConsumer  } from "./services/kafka/consumer.js";

// Inicializa el consumidor al inicio de la aplicación
// const kafka = runConsumer().catch(error => console.error(`Error en runConsumer: ${error}`));

let GLOBAL_OPTS = {};
let opcionSeleccionadaGlobal = null; // Variable global para almacenar la elección del usuario

const flowLinks = bot
  .addKeyword(["Links", "link"])
  .addAnswer([
    `Bienvenidos a mi asistente de examen`,
    `selecciona segun la opcion:`,
    `- 1. Descargar video`,
    `- 2. Descargar audio`,
    `- 3. Playlist de audio`,
    `- 4. Playlist de video`,
  ])
  .addAnswer(
    `marca cualquier opcion: 1 2 3 4`,
    { capture: true },
    async (ctx, { gotoFlow, state }) => {
      try {
      disconnectConsumer();
      GLOBAL_OPTS = {};
        const opcionSeleccionada = parseInt(ctx.body.trim());

      // runConsumer().catch(error => console.error(`Error en runConsumer: ${error}`));
        
        // Verificar si la opción seleccionada es válida
        if (opcionSeleccionada >= 1 && opcionSeleccionada <= 4) {
          opcionSeleccionadaGlobal = opcionSeleccionada; // Almacenar la elección del usuario en la variable global
          // return gotoFlow('esperarLink');
        } else {
          console.error("Opción seleccionada no válida.");
          // return gotoFlow(flowLinks);
        }
      } catch (error) {
        console.error("Ocurrió un error:", error);
        // return gotoFlow(flowLinks);
      }
    }
  )
  .addAnswer(
    `Ahora por favor ingrese el link`,
    { capture: true,  }, // Indicar que esta respuesta pertenece al flujo 'esperarLink'
    async (ctx, { gotoFlow }) => {
      try {
        const linkUsuario = ctx.body.trim();



        // Obtener la opción seleccionada del usuario desde la variable global
        const opcionSeleccionada = opcionSeleccionadaGlobal;

        // Verificar si la opción seleccionada es válida
        if (opcionSeleccionada) {
          GLOBAL_OPTS[opcionSeleccionada] = linkUsuario; // Asignar el enlace proporcionado por el usuario a la opción seleccionada
          // console.log(GLOBAL_OPTS);

        // await disconnectConsumer();
        sendKafkaMessage("links", JSON.stringify(GLOBAL_OPTS));
        // runConsumer().catch(error => console.error(`Error en runConsumer: ${error}`));


        // runConsumer().catch(error => console.error(`Error en runConsumer: ${error}`));
          // return gotoFlow(flowConsumer)
        } else {
          console.error("Opción seleccionada no válida.");
          // await disconnectConsumer();

          // return gotoFlow(flowLinks);
        }
      } catch (error) {
        console.error("Ocurrió un error:", error);
        
        // return gotoFlow(flowLinks);
      }
    }
  )
  .addAnswer(
    `Trabajando...`,
    null, 
    // async (ctx, { gotoFlow }) => {
    async (_, { flowDynamic }) => {
    try {
      // Espera a que runConsumer se resuelva
      const kafka = await runConsumer();
      
      // Asegúrate de que kafka tenga un valor antes de usarlo
      if (kafka) {
        // Enviar la respuesta usando el mensaje obtenido de Kafka
        await flowDynamic(`Respuesta recibida desde app dentro try: ${kafka}`);
        console.log("Mensaje desde app: dentro try", kafka);
        await disconnectConsumer();
      } else {
        await flowDynamic("No se recibió ningún mensaje válido desde Kafka.");
        await disconnectConsumer();
      }

      console.log("Mensaje Kafka: app fuera try", kafka);

    } catch (error) {
      console.error("Error en la función de consumo:", error);
      await flowDynamic("Hubo un error al obtener la respuesta desde Kafka.");
    }
  }
  );



import axios from 'axios'; // Importa axios para solicitudes HTTP
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url'; // Para obtener el nombre del archivo en la ruta actual

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const flowArchivo = bot
  .addKeyword("pdf" ) // Agrega "pdf" y "audio" como palabras clave
  .addAnswer(
    `Adjunte el archivo`,
    { capture: true },
    async (ctx, { gotoFlow }) => {
      try {
        // Verifica si `documentMessage` está definido
        const documentMessage = ctx.message?.documentMessage;

        if (documentMessage) {
          const fileUrl = documentMessage.url; // Obtén la URL del archivo
          const fileName = documentMessage.fileName; // Obtén el nombre del archivo

          const filePath = path.resolve(__dirname, fileName); // Ruta donde guardar el archivo

          // Descargar el archivo
          const response = await axios({
            url: fileUrl,
            method: 'GET',
            responseType: 'stream'
          });

          // Guardar el archivo en el sistema de archivos
          response.data.pipe(fs.createWriteStream(filePath));
          console.log('Archivo descargado y guardado en', filePath);
        } else {
          console.log('No hay mensajes de documentos en el mensaje.');
        }

        // Redirigir al siguiente flujo
        return gotoFlow(flowEnvio);
      } catch (error) {
        console.error("Ocurrió un error:", error.message);
        // Redirigir al flujo principal en caso de error
        return gotoFlow(flowEnvio);
      }
    }
  );

const flowEnvio = bot
  .addKeyword("envio")
  .addAnswer(
    `Vamos a devolver el archivo`,
    null,
    async (_, { flowDynamic }) => {
      try {
        // Nombre del archivo específico
        const fileName = 'hola.txt';
        const filePath = '/home/kamilo/programming/kafka_wp/hola.txt';

        // Verificar que el archivo existe
        // if (fs.existsSync(filePath)) {
          // Crear un objeto de mensaje para enviar el archivo
        const fileMessage = {
            body: 'Aquí tienes el archivo solicitado:',
            media:'/home/kamilo/programming/kafka_wp/hola.txt', 
            // Ruta al archivo en el servidor
            delay: 1000 // Puedes ajustar el retraso si es necesario
          };

          // Enviar el mensaje que incluye el archivo
          await flowDynamic([fileMessage]);

          // Mensaje de confirmación
          await flowDynamic('Archivo enviado al usuario.');
        // } else {
          // await flowDynamic('El archivo no se encontró en la ruta esperada:', filePath);
        // }
      } catch (error) {
        console.log("Error al enviar el archivo:", error);
        console.log(filePath)
      }
    }
  );
const MENU_CLIENTE = {
  pollo: [],
  res: [],
  cerdo: [],
  pescado: [],
  proteina: [],
  sopa: [],
  bebida: [],
  acomp_a: [],
  acomp_b: [],
  acomp_c: [],
};
const flowPrincipal = bot
  .addKeyword(["hola", "hi", "buenos dias", "buenas tardes"])
  .addAnswer([
    `Bienvenidos a mi restaurante de cocina economica automatizado! 🚀`,
    `Tenemos menus diarios variados`,
    `Te gustaria conocerlos ¿?`,
    `Escribe *si*`,
  ]);

const flowAcomp_a = bot
  .addKeyword("menu", { capture: true })
  .addAnswer(
    `Hoy tenemos el siguiente menú:`,
    null,
    async (_, { flowDynamic }) => {
      try {
        const columnNumber = 6;
        const getMenu = await googelSheet.retriveDayMenu(columnNumber); // Recupera el menú del día actual sin usar fechas

        if (getMenu.length === 0) {
          await flowDynamic("Lo siento, no hay menú disponible para hoy.");
          return;
        }

        for (const menu of getMenu) {
          GLOBAL_STATE.push(menu);
          await flowDynamic(menu);
        }
      } catch (error) {
        console.error("Error al recuperar el menú:", error);
        await flowDynamic(
          "Lo siento, hubo un error al recuperar el menú. Por favor, inténtalo de nuevo más tarde.",
        );
      }
    },
  )
  .addAnswer(
    `¿Te interesa alguno marca la opcion?`,
    { capture: true },
    async (ctx, { gotoFlow, state }) => {
      try {
        const opcionSeleccionada = parseInt(ctx.body.trim()); // Convertir la opción seleccionada a un entero
        const seleccion = GLOBAL_STATE[opcionSeleccionada - 1]; // Obtener el elemento correspondiente en GLOBAL_STATE
        // Almacenar la selección del usuario en MENU_CLIENTE
        MENU_CLIENTE.acomp_a.push(seleccion);
        // Almacenar el elemento seleccionado en el estado
        state.update({ pedido: seleccion });

        GLOBAL_STATE = [];
        // Redirigir al flujo de pedido
        return gotoFlow(flowAcomp_b);
      } catch (error) {
        console.error("Ocurrió un error:", error);
        // Redirigir al flujo principal en caso de error
        return gotoFlow(flowPrincipal);
      }
    },
  );
const flowProteina = bot
  .addKeyword("si", { capture: true })
  .addAnswer(
    `Hoy tenemos el siguiente menú:`,
    null,
    async (_, { flowDynamic }) => {
      try {
        const columnNumber = 1;
        const getMenu = await googelSheet.retriveDayMenu(columnNumber); // Recupera el menú del día actual sin usar fechas

        if (getMenu.length === 0) {
          await flowDynamic("Lo siento, no hay menú disponible para hoy.");
          return;
        }

        for (const menu of getMenu) {
          GLOBAL_STATE.push(menu);
          await flowDynamic(menu);
        }
      } catch (error) {
        console.error("Error al recuperar el menú:", error);
        await flowDynamic(
          "Lo siento, hubo un error al recuperar el menú. Por favor, inténtalo de nuevo más tarde.",
        );
      }
    },
  )

  .addAnswer(
    `¿Te interesa alguno marca la opcion?`,
    { capture: true },
    async (ctx, { gotoFlow, state }) => {
      try {
        const opcionSeleccionada = parseInt(ctx.body.trim()); // Convertir la opción seleccionada a un entero
        const seleccion = GLOBAL_STATE[opcionSeleccionada - 1].split(". ")[1];
        // Almacenar la selección del usuario en MENU_CLIENTE
        console.log(GLOBAL_STATE);
        // Almacenar el elemento seleccionado en el estado
        state.update({ pedido: seleccion });
        GLOBAL_STATE = [];
        // Redirigir al flujo correspondiente basado en la opción seleccionada
        switch (opcionSeleccionada) {
          case 1:
            return gotoFlow(flowPollo);

          case 2:
            return gotoFlow(flowPescado);
          case 3:
            return gotoFlow(flowRes);
          case 4:
            return gotoFlow(flowCerdo);
          default:
            return gotoFlow(flowPrincipal);
        }
      } catch (error) {
        console.error("Ocurrió un error:", error);
        // Redirigir al flujo principal en caso de error
        return gotoFlow(flowPrincipal);
      }
    },
  );

const flowPollo = bot
  .addKeyword("menu", { capture: true })
  .addAnswer(
    `Hoy tenemos el siguiente menú:`,
    null,
    async (_, { flowDynamic }) => {
      try {
        const columnNumber = 2;
        const getMenu = await googelSheet.retriveDayMenu(columnNumber); //Recupera el menú del día actual sin usar fechas

        if (getMenu.length === 0) {
          await flowDynamic("Lo siento, no hay menú disponible para hoy.");
          return;
        }

        for (const menu of getMenu) {
          GLOBAL_STATE.push(menu);
          await flowDynamic(menu);
        }
      } catch (error) {
        console.error("Error al recuperar el menú:", error);
        await flowDynamic(
          "Lo siento, hubo un error al recuperar el menú. Por favor, inténtalo de nuevo más tarde.",
        );
      }
    },
  )
  .addAnswer(
    `¿Te interesa alguno marca la opcion?`,
    { capture: true },
    async (ctx, { gotoFlow, state }) => {
      try {
        const opcionSeleccionada = parseInt(ctx.body.trim()); // Convertir la opción seleccionada a un entero
        const seleccion = GLOBAL_STATE[opcionSeleccionada - 1].split(". ")[1];
        MENU_CLIENTE.pollo.push(seleccion);
        // Almacenar el elemento seleccionado en el estado
        console.log(`Imprimido desde pollo: ${GLOBAL_STATE}`);
        state.update({ pedido: seleccion });

        GLOBAL_STATE = [];
        // Redirigir al flujo de pedido
        return gotoFlow(flowAcomp_a);
      } catch (error) {
        console.error("Ocurrió un error:", error);
        // Redirigir al flujo principal
        return gotoFlow(flowPrincipal);
      }
    },
  );
const flowPescado = bot
  .addKeyword("menu", { capture: true })
  .addAnswer(
    `Hoy tenemos el siguiente menú:`,
    null,
    async (_, { flowDynamic }) => {
      try {
        const columnNumber = 3;
        const getMenu = await googelSheet.retriveDayMenu(columnNumber); // Recupera el menú del día actual sin usar fechas

        if (getMenu.length === 0) {
          await flowDynamic("Lo siento, no hay menú disponible para hoy.");
          return;
        }

        for (const menu of getMenu) {
          GLOBAL_STATE.push(menu);
          await flowDynamic(menu);
        }
      } catch (error) {
        console.error("Error al recuperar el menú:", error);
        await flowDynamic(
          "Lo siento, hubo un error al recuperar el menú. Por favor, inténtalo de nuevo más tarde.",
        );
      }
    },
  )
  .addAnswer(
    `¿Te interesa alguno marca la opcion?`,
    { capture: true },
    async (ctx, { gotoFlow, state }) => {
      try {
        const opcionSeleccionada = parseInt(ctx.body.trim()); // Convertir la opción seleccionada a un entero
        const seleccion = GLOBAL_STATE[opcionSeleccionada - 1]; // Obtener el elemento correspondiente en GLOBAL_STATE
        // Almacenar la selección del usuario en MENU_CLIENTE
        MENU_CLIENTE.pescado.push(seleccion);
        // Almacenar el elemento seleccionado en el estado
        state.update({ pedido: seleccion });

        GLOBAL_STATE = [];
        // Redirigir al flujo de pedido
        return gotoFlow(flowAcomp_a);
      } catch (error) {
        console.error("Ocurrió un error:", error);
        // Redirigir al flujo principal en caso de error
        return gotoFlow(flowPrincipal);
      }
    },
  );

const flowRes = bot
  .addKeyword("menu", { capture: true })
  .addAnswer(
    `Hoy tenemos el siguiente menú:`,
    null,
    async (_, { flowDynamic }) => {
      try {
        const columnNumber = 4;
        const getMenu = await googelSheet.retriveDayMenu(columnNumber); // Recupera el menú del día actual sin usar fechas

        if (getMenu.length === 0) {
          await flowDynamic("Lo siento, no hay menú disponible para hoy.");
          return;
        }

        for (const menu of getMenu) {
          GLOBAL_STATE.push(menu);
          await flowDynamic(menu);
        }
      } catch (error) {
        console.error("Error al recuperar el menú:", error);
        await flowDynamic(
          "Lo siento, hubo un error al recuperar el menú. Por favor, inténtalo de nuevo más tarde.",
        );
      }
    },
  )

  .addAnswer(
    `¿Te interesa alguno marca la opcion?`,
    { capture: true },
    async (ctx, { gotoFlow, state }) => {
      try {
        const opcionSeleccionada = parseInt(ctx.body.trim()); // Convertir la opción seleccionada a un entero
        const seleccion = GLOBAL_STATE[opcionSeleccionada - 1]; // Obtener el elemento correspondiente en GLOBAL_STATE
        // Almacenar la selección del usuario en MENU_CLIENTE
        MENU_CLIENTE.pescado.push(seleccion);
        // Almacenar el elemento seleccionado en el estado
        state.update({ pedido: seleccion });

        GLOBAL_STATE = [];
        // Redirigir al flujo de pedido
        return gotoFlow(flowAcomp_a);
      } catch (error) {
        console.error("Ocurrió un error:", error);
        // Redirigir al flujo principal en caso de error
        return gotoFlow(flowPrincipal);
      }
    },
  );
const flowCerdo = bot
  .addKeyword("menu", { capture: true })
  .addAnswer(
    `Hoy tenemos el siguiente menú:`,
    null,
    async (_, { flowDynamic }) => {
      try {
        const columnNumber = 5;
        const getMenu = await googelSheet.retriveDayMenu(columnNumber); // Recupera el menú del día actual sin usar fechas

        if (getMenu.length === 0) {
          await flowDynamic("Lo siento, no hay menú disponible para hoy.");
          return;
        }

        for (const menu of getMenu) {
          GLOBAL_STATE.push(menu);
          await flowDynamic(menu);
        }
      } catch (error) {
        console.error("Error al recuperar el menú:", error);
        await flowDynamic(
          "Lo siento, hubo un error al recuperar el menú. Por favor, inténtalo de nuevo más tarde.",
        );
      }
    },
  )

  .addAnswer(
    `¿Te interesa alguno marca la opcion?`,
    { capture: true },
    async (ctx, { gotoFlow, state }) => {
      try {
        const opcionSeleccionada = parseInt(ctx.body.trim()); // Convertir la opción seleccionada a un entero
        const seleccion = GLOBAL_STATE[opcionSeleccionada - 1]; // Obtener el elemento correspondiente en GLOBAL_STATE
        // Almacenar la selección del usuario en MENU_CLIENTE
        MENU_CLIENTE.cerdo.push(seleccion);
        // Almacenar el elemento seleccionado en el estado
        state.update({ pedido: seleccion });

        GLOBAL_STATE = [];
        // Redirigir al flujo de pedido
        return gotoFlow(flowAcomp_a);
      } catch (error) {
        console.error("Ocurrió un error:", error);
        // Redirigir al flujo principal en caso de error
        return gotoFlow(flowPrincipal);
      }
    },
  );
const flowAcomp_b = bot
  .addKeyword("menu", { capture: true })
  .addAnswer(
    `Hoy tenemos el siguiente menú:`,
    null,
    async (_, { flowDynamic }) => {
      try {
        const columnNumber = 7;
        const getMenu = await googelSheet.retriveDayMenu(columnNumber); // Recupera el menú del día actual sin usar fechas

        if (getMenu.length === 0) {
          await flowDynamic("Lo siento, no hay menú disponible para hoy.");
          return;
        }

        for (const menu of getMenu) {
          GLOBAL_STATE.push(menu);
          await flowDynamic(menu);
        }
      } catch (error) {
        console.error("Error al recuperar el menú:", error);
        await flowDynamic(
          "Lo siento, hubo un error al recuperar el menú. Por favor, inténtalo de nuevo más tarde.",
        );
      }
    },
  )

  .addAnswer(
    `¿Te interesa alguno marca la opcion?`,
    { capture: true },
    async (ctx, { gotoFlow, state }) => {
      try {
        const opcionSeleccionada = parseInt(ctx.body.trim()); // Convertir la opción seleccionada a un entero
        const seleccion = GLOBAL_STATE[opcionSeleccionada - 1]; // Obtener el elemento correspondiente en GLOBAL_STATE
        // Almacenar la selección del usuario en MENU_CLIENTE
        MENU_CLIENTE.acomp_b.push(seleccion);
        // Almacenar el elemento seleccionado en el estado
        state.update({ pedido: seleccion });

        GLOBAL_STATE = [];
        // Redirigir al flujo de pedido
        return gotoFlow(flowAcomp_c);
      } catch (error) {
        console.error("Ocurrió un error:", error);
        // Redirigir al flujo principal en caso de error
        return gotoFlow(flowPrincipal);
      }
    },
  );
const flowAcomp_c = bot
  .addKeyword("menu", { capture: true })
  .addAnswer(
    `Hoy tenemos el siguiente menú:`,
    null,
    async (_, { flowDynamic }) => {
      try {
        const columnNumber = 8;
        const getMenu = await googelSheet.retriveDayMenu(columnNumber); // Recupera el menú del día actual sin usar fechas

        if (getMenu.length === 0) {
          await flowDynamic("Lo siento, no hay menú disponible para hoy.");
          return;
        }

        for (const menu of getMenu) {
          GLOBAL_STATE.push(menu);
          await flowDynamic(menu);
        }
      } catch (error) {
        console.error("Error al recuperar el menú:", error);
        await flowDynamic(
          "Lo siento, hubo un error al recuperar el menú. Por favor, inténtalo de nuevo más tarde.",
        );
      }
    },
  )

  .addAnswer(
    `¿Te interesa alguno marca la opcion?`,
    { capture: true },
    async (ctx, { gotoFlow, state }) => {
      try {
        const opcionSeleccionada = parseInt(ctx.body.trim()); // Convertir la opción seleccionada a un entero
        const seleccion = GLOBAL_STATE[opcionSeleccionada - 1]; // Obtener el elemento correspondiente en GLOBAL_STATE
        // Almacenar la selección del usuario en MENU_CLIENTE
        MENU_CLIENTE.acomp_c.push(seleccion);
        // Almacenar el elemento seleccionado en el estado
        state.update({ pedido: seleccion });

        GLOBAL_STATE = [];
        // Redirigir al flujo de pedido
        return gotoFlow(flowSopa);
      } catch (error) {
        console.error("Ocurrió un error:", error);
        // Redirigir al flujo principal en caso de error
        return gotoFlow(flowPrincipal);
      }
    },
  );
const flowSopa = bot
  .addKeyword("menu", { capture: true })
  .addAnswer(
    `Hoy tenemos el siguiente menú:`,
    null,
    async (_, { flowDynamic }) => {
      try {
        const columnNumber = 9;
        const getMenu = await googelSheet.retriveDayMenu(columnNumber); // Recupera el menú del día actual sin usar fechas

        if (getMenu.length === 0) {
          await flowDynamic("Lo siento, no hay menú disponible para hoy.");
          return;
        }

        for (const menu of getMenu) {
          GLOBAL_STATE.push(menu);
          await flowDynamic(menu);
        }
      } catch (error) {
        console.error("Error al recuperar el menú:", error);
        await flowDynamic(
          "Lo siento, hubo un error al recuperar el menú. Por favor, inténtalo de nuevo más tarde.",
        );
      }
    },
  )

  .addAnswer(
    `¿Te interesa alguno marca la opcion?`,
    { capture: true },
    async (ctx, { gotoFlow, state }) => {
      try {
        const opcionSeleccionada = parseInt(ctx.body.trim()); // Convertir la opción seleccionada a un entero
        const seleccion = GLOBAL_STATE[opcionSeleccionada - 1]; // Obtener el elemento correspondiente en GLOBAL_STATE
        // Almacenar la selección del usuario en MENU_CLIENTE
        MENU_CLIENTE.sopa.push(seleccion);
        // Almacenar el elemento seleccionado en el estado
        state.update({ pedido: seleccion });

        GLOBAL_STATE = [];
        // Redirigir al flujo de pedido
        return gotoFlow(flowBebida);
      } catch (error) {
        console.error("Ocurrió un error:", error);
        // Redirigir al flujo principal en caso de error
        return gotoFlow(flowPrincipal);
      }
    },
  );
const flowBebida = bot
  .addKeyword("menu", { capture: true })
  .addAnswer(
    `Hoy tenemos el siguiente menú:`,
    null,
    async (_, { flowDynamic }) => {
      try {
        const columnNumber = 10;
        const getMenu = await googelSheet.retriveDayMenu(columnNumber); // Recupera el menú del día actual sin usar fechas

        if (getMenu.length === 0) {
          await flowDynamic("Lo siento, no hay menú disponible para hoy.");
          return;
        }

        for (const menu of getMenu) {
          GLOBAL_STATE.push(menu);
          await flowDynamic(menu);
        }
      } catch (error) {
        console.error("Error al recuperar el menú:", error);
        await flowDynamic(
          "Lo siento, hubo un error al recuperar el menú. Por favor, inténtalo de nuevo más tarde.",
        );
      }
    },
  )

  .addAnswer(
    `¿Te interesa alguno marca la opcion?`,
    { capture: true },
    async (ctx, { gotoFlow, state }) => {
      try {
        const opcionSeleccionada = parseInt(ctx.body.trim()); // Convertir la opción seleccionada a un entero
        const seleccion = GLOBAL_STATE[opcionSeleccionada - 1]; // Obtener el elemento correspondiente en GLOBAL_STATE
        // Almacenar la selección del usuario en MENU_CLIENTE
        MENU_CLIENTE.bebida.push(seleccion);
        // Almacenar el elemento seleccionado en el estado
        state.update({ pedido: seleccion });

        GLOBAL_STATE = [];
        // Redirigir al flujo de pedido
        return gotoFlow(flowPedido);
      } catch (error) {
        console.error("Ocurrió un error:", error);
        // Redirigir al flujo principal en caso de error
        return gotoFlow(flowPrincipal);
      }
    },
  );
const flowEmpty = bot
  .addKeyword(bot.EVENTS.ACTION)
  .addAnswer("No te he entendido!", null, async (_, { gotoFlow }) => {
    return gotoFlow(flowPrincipal);
  });

const flowPedido = bot
  .addKeyword(["pedir"])
  .addAnswer(
    "¿Cual es tu nombre?",
    { capture: true },
    async (ctx, { state }) => {
      state.update({ name: ctx.body });
    },
  )
  .addAnswer("¿Direccion?", { capture: true }, async (ctx, { state }) => {
    state.update({ observaciones: ctx.body });
  })
  .addAnswer(
    "Perfecto tu pedido estara listo en un aprox 20min",
    null,
    async (ctx, { state }) => {
      const currentState = state.getMyState();
      console.log(currentState.pedido);
      console.log(MENU_CLIENTE);

      // Filtrar las opciones vacías de MENU_CLIENTE y crear un mensaje corto
      const pedido = Object.entries(MENU_CLIENTE)
        .filter(([key, value]) => value.length > 0)
        .map(([key, value]) => `${key}: ${value.join(", ")}`)
        .join("\n");

      // Guardar el pedido
      await googelSheet.saveOrder({
        fecha: new Date().toDateString(),
        telefono: ctx.from,
        nombre: currentState.name,
        pedido: pedido,
        observaciones: currentState.observaciones,
      });

      // Limpiar la variable MENU_CLIENTE
      for (const key in MENU_CLIENTE) {
        if (Object.hasOwnProperty.call(MENU_CLIENTE, key)) {
          MENU_CLIENTE[key] = []; // Asignar un array vacío a cada propiedad
        }
      }
    },
  );

const main = async () => {
  const adapterDB = new MockAdapter();
  const adapterFlow = bot.createFlow([
    flowLinks,
    // flowConsumer,
    // flowArchivo,
    flowEnvio,


    // flowPedido,
    // flowPollo,
    // flowRes,
    // flowCerdo,
    // flowPescado,
    // flowProteina,
    // flowSopa,
    // flowBebida,
    // flowAcomp_a,
    // flowAcomp_b,
    // flowAcomp_c,

    flowEmpty,
  ]);
  const adapterProvider = bot.createProvider(BaileysProvider);

  bot.createBot({
    flow: adapterFlow,
    provider: adapterProvider,
    database: adapterDB,
  });

  QRPortalWeb();
};

main();
