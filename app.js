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

// Importa la función sendKafkaMessage desde el archivo producer.js
import { sendKafkaMessage } from "./services/kafka/producer.js";

// Función para enviar el mensaje "hola" al tema especificado
async function enviarMensajeHola() {
  const topic = "prueba"; // Reemplaza "mi-topico" con el nombre de tu tema
  const message = "hola, este es un mensaje de prueba";

  try {
    // Llama a la función sendKafkaMessage para enviar el mensaje
    await sendKafkaMessage(topic, message);
    console.log("Mensaje 'hola' enviado exitosamente al tema:", topic);
  } catch (error) {
    console.error("Error al enviar el mensaje:", error.message);
  }
}

// Llama a la función para enviar el mensaje "hola"
enviarMensajeHola();

const flowLinks = bot
  .addKeyword(["links", "pdf"])
  .addAnswer([`Bienvenidos a mi asistente de examen `, `Escribe el *link*`])
  .addAnswer(
    `¿Te interesa algún enlace?`, // Preguntar al usuario si está interesado en algún enlace
    { capture: true },
    async (ctx, { gotoFlow }) => {
      try {
        const linkUsuario = ctx.body.trim(); // Capturar el enlace proporcionado por el usuario

        // Enviar el enlace al topic de Kafka utilizando la función sendKafkaMessage
        await sendKafkaMessage("prueba", linkUsuario); // Asegúrate de reemplazar "mi-tema" con el nombre del topic correcto

        // Redirigir al siguiente flujo
        return gotoFlow(flowLinks);
      } catch (error) {
        console.error("Ocurrió un error:", error);
        // Redirigir al flujo principal en caso de error
        return gotoFlow(flowLinks);
      }
    },
  );

const flowPdf = bot
  .addKeyword([ "pdf", "audio"]) // Agrega "audio" como palabra clave
  .addAnswer([`Bienvenidos a mi asistente de examen`, `Escribe el *link* o envía un PDF o audio`])
  .addAnswer(
    `¿Te interesa algún enlace o quieres enviar un PDF o audio?`,
    { capture: true },
    async (ctx, { gotoFlow }) => {
      try {
        // Verificar si el mensaje es un enlace, un PDF o un audio
        const isLink = ctx.body.includes("http");
        const isPDF = ctx.message.attachments.find(attachment => attachment.type === "document" && attachment.payload.mimetype === "application/pdf");
        const isAudio = ctx.message.attachments.find(attachment => attachment.type === "audio");

        if (isLink) {
          const linkUsuario = ctx.body.trim(); // Capturar el enlace proporcionado por el usuario
          await sendKafkaMessage("prueba", linkUsuario); // Enviar el enlace al topic de Kafka
        } else if (isPDF) {
          const pdfURL = isPDF.payload.url; // Obtener la URL del PDF adjunto
          await sendKafkaMessage("prueba", pdfURL); // Enviar la URL del PDF al topic de Kafka
        } else if (isAudio) {
          const audioURL = isAudio.payload.url; // Obtener la URL del audio adjunto
          await sendKafkaMessage("prueba", audioURL); // Enviar la URL del audio al topic de Kafka
        }

        // Redirigir al siguiente flujo
        return gotoFlow(flowLinks);
      } catch (error) {
        console.error("Ocurrió un error:", error);
        // Redirigir al flujo principal en caso de error
        return gotoFlow(flowLinks);
      }
    },
  );
let GLOBAL_STATE = [];
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
    flowPdf,

    flowPedido,
    flowPollo,
    flowRes,
    flowCerdo,
    flowPescado,
    flowProteina,
    flowSopa,
    flowBebida,
    flowAcomp_a,
    flowAcomp_b,
    flowAcomp_c,

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
