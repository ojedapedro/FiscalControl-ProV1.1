
// ID de tu Hoja de Cálculo
const SPREADSHEET_ID = '1EaYm-kbgFciU2ZFIJk5B8rLb9y07hZEDbGKIiElLbd8';

function doPost(e) {
  return handleRequest(e);
}

function doGet(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const params = e.parameter;
    const action = params.action;
    let data = {};
    
    // Si viene cuerpo POST, parsearlo
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let result = { status: 'success' };

    switch (action) {
      case 'setup':
        result = setupDatabase(ss);
        break;

      case 'getPayments':
        result.data = getData(ss, 'Payments');
        break;

      case 'addPayment':
        addRow(ss, 'Payments', data);
        break;

      case 'updatePayment':
        updateRow(ss, 'Payments', data.id, data);
        break;
      
      case 'deletePayment':
        deleteRow(ss, 'Payments', data.id);
        break;

      default:
        result = { status: 'error', message: 'Acción desconocida' };
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// --- FUNCIONES CORE ---

function setupDatabase(ss) {
  const schema = {
    'Payments': ['id', 'storeId', 'storeName', 'userId', 'category', 'specificType', 'amount', 'dueDate', 'paymentDate', 'status', 'notes', 'rejectionReason', 'submittedDate', 'history', 'receiptUrl'],
    'Stores': ['id', 'name', 'location', 'status', 'nextDeadline', 'matrixId'],
    'Users': ['id', 'username', 'role', 'email']
  };

  const created = [];

  for (const [sheetName, headers] of Object.entries(schema)) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(headers); // Crear cabeceras
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f3f4f6');
      created.push(sheetName);
    }
  }

  return { message: 'Estructura creada/verificada correctamente', sheets: created };
}

function getData(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  const headers = data.shift(); // Quitar cabeceras
  
  return data.map(row => {
    let obj = {};
    headers.forEach((header, i) => {
      // Intentar parsear JSON para campos complejos como 'history'
      if (header === 'history' && row[i]) {
        try {
          obj[header] = JSON.parse(row[i]);
        } catch (e) {
          obj[header] = [];
        }
      } else {
        obj[header] = row[i];
      }
    });
    return obj;
  });
}

function addRow(ss, sheetName, item) {
  const sheet = ss.getSheetByName(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(header => {
    const val = item[header];
    return (typeof val === 'object') ? JSON.stringify(val) : val;
  });
  sheet.appendRow(row);
}

function updateRow(ss, sheetName, id, updates) {
  const sheet = ss.getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIndex = headers.indexOf('id');
  
  // Encontrar fila (empezando desde fila 2, indice 1)
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIndex]) === String(id)) {
      // Actualizar columnas específicas
      headers.forEach((header, colIndex) => {
        if (updates.hasOwnProperty(header)) {
          let val = updates[header];
          if (typeof val === 'object') val = JSON.stringify(val);
          sheet.getRange(i + 1, colIndex + 1).setValue(val);
        }
      });
      return;
    }
  }
  throw new Error('ID no encontrado: ' + id);
}

function deleteRow(ss, sheetName, id) {
  const sheet = ss.getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  const idIndex = data[0].indexOf('id');
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIndex]) === String(id)) {
      sheet.deleteRow(i + 1);
      return;
    }
  }
}
