import { JWT } from "google-auth-library";
import { GoogleSpreadsheet } from "google-spreadsheet";
const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
];

class GoogleSheetService {
  jwtFromEnv = undefined;
  doc = undefined;

  constructor(id = undefined) {
    if (!id) {
      throw new Error("ID_UNDEFINED");
    }

    this.jwtFromEnv = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      scopes: SCOPES,
    });
    this.doc = new GoogleSpreadsheet(id, this.jwtFromEnv);
  }

  /**
   * Recuperar el menu del dia
   * @param {*} dayNumber
   * @returns
   */
  retriveDayMenu = async (columnNumber = 0) => {
    try {
      const list = [];
      await this.doc.loadInfo();
      const sheet = this.doc.sheetsByIndex[0]; // the first sheet
      await sheet.loadCells("A1:J10");
      const rows = await sheet.getRows();
      for (const a of Array.from(Array(rows.length).keys())) {
        const cellA1 = sheet.getCell(a + 1, columnNumber - 1);
        list.push(cellA1.value || null);
      }

      return list;
    } catch (err) {
      console.log(err);
      return undefined;
    }
  };

  retrivePrueba = async (columna = 0) => {
    try {
      const list = [];
      await this.doc.loadInfo();
      const sheet = this.doc.sheetsByIndex[0]; // the first sheet
      await sheet.loadCells("A1:A10"); // Cargar solo las celdas de la columna A
      for (let a = 0; a < 10; a++) {
        // Iterar sobre las filas que desees, en este caso, 10
        const cell = sheet.getCell(a, 0); // Obtener la celda en la columna A y la fila actual
        list.push(cell.value || null); // Agregar el valor de la celda a la lista, si está definido, de lo contrario, agregar null
      }
      return list;
    } catch (err) {
      console.log(err);
      return undefined;
    }
  };

  /**
   * Guardar pedido
   * @param {*} data
   */
  saveOrder = async (data = {}) => {
    await this.doc.loadInfo();
    const sheet = this.doc.sheetsByIndex[1]; // the first sheet

    const order = await sheet.addRow({
      fecha: data.fecha,
      telefono: data.telefono,
      nombre: data.nombre,
      pedido: data.pedido,
      observaciones: data.observaciones,
    });

    return order;
  };

  /**
   * Guardar pedido
   * @param {*} data
   */
  saveOrder = async (data = {}) => {
    await this.doc.loadInfo();
    const sheet = this.doc.sheetsByIndex[1]; // the first sheet

    const order = await sheet.addRow({
      fecha: data.fecha,
      telefono: data.telefono,
      nombre: data.nombre,
      pedido: data.pedido,
      observaciones: data.observaciones,
    });

    return order;
  };
}

export default GoogleSheetService;
