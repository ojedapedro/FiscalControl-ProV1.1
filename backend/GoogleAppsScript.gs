
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
    const params = e ? e.parameter : {}; 
    const action = params.action;
    let data = {};
    
    if (e && e.postData && e.postData.contents) {
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

      case 'saveSettings':
        saveSettings(ss, data);
        result = { status: 'success', message: 'Configuración guardada' };
        break;

      case 'getSettings':
        result.data = getSettings(ss);
        break;

      case 'checkNotifications':
        // Endpoint manual para testear el envío
        const count = checkDeadlinesAndNotify();
        result = { status: 'success', message: `Chequeo ejecutado. Mensajes enviados: ${count}` };
        break;

      default:
        result = { status: 'error', message: 'Acción desconocida o petición vacía' };
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

// --- AUTOMATIZACIÓN WHATSAPP ---

/**
 * Esta función debe ser configurada con un TRIGGER de tiempo en Google Apps Script.
 * Ve a "Activadores" (icono reloj) > Añadir activador > checkDeadlinesAndNotify > Según tiempo > Diario.
 */
function checkDeadlinesAndNotify() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const settings = getSettings(ss);
  
  // Validación estricta antes de procesar
  if (!settings || !settings.whatsappEnabled || !settings.whatsappGatewayUrl) {
    Logger.log("WhatsApp desactivado o sin configurar (URL vacía)");
    return 0;
  }

  const payments = getData(ss, 'Payments');
  const today = new Date();
  // Normalizar hoy a medianoche para comparaciones de fecha pura
  today.setHours(0,0,0,0);

  let messagesSent = 0;

  payments.forEach(p => {
    if (p.status !== 'Pendiente' && p.status !== 'En Riesgo') return;

    // Convertir dueDate (YYYY-MM-DD) a Objeto Date
    const parts = p.dueDate.split('-');
    const dueDate = new Date(parts[0], parts[1] - 1, parts[2]);
    
    // Calcular diferencia en días: (Due - Today)
    const diffTime = dueDate - today; 
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    let shouldNotify = false;
    let messagePrefix = "";

    // Lógica de Alertas
    if (diffDays === settings.daysBeforeWarning) {
      shouldNotify = true;
      messagePrefix = "⚠️ *RECORDATORIO DE PAGO*";
    } else if (diffDays === settings.daysBeforeCritical) {
      shouldNotify = true;
      messagePrefix = "🚨 *URGENTE: PAGO PRÓXIMO A VENCER*";
    } else if (diffDays < 0 && diffDays > -3) { // Aviso de vencido (primeros 3 días)
      shouldNotify = true;
      messagePrefix = "❌ *PAGO VENCIDO*";
    }

    if (shouldNotify) {
      const message = `${messagePrefix}\n\n` +
                      `Tienda: ${p.storeName}\n` +
                      `Concepto: ${p.specificType}\n` +
                      `Monto: $${p.amount}\n` +
                      `Vence: ${p.dueDate}\n` +
                      `\n_Por favor gestione este pago en la plataforma._`;
      
      const success = sendWhatsAppMessage(settings.whatsappGatewayUrl, settings.whatsappPhone, message);
      if (success) messagesSent++;
    }
  });

  return messagesSent;
}

function sendWhatsAppMessage(gatewayUrl, phone, message) {
  try {
    // CORRECCIÓN: Validación defensiva para evitar TypeError si gatewayUrl llega undefined
    if (!gatewayUrl) {
      Logger.log("Error: URL de Gateway no definida o vacía");
      return false;
    }

    // Asegurar que es string y eliminar espacios
    let finalUrl = String(gatewayUrl).trim();
    if (finalUrl === "") return false;

    // Codificar mensaje para URL
    const encodedMessage = encodeURIComponent(message);
    
    // Construir URL. Soportamos formato simple tipo CallMeBot:
    // url?phone=XXXX&text=Mensaje&apikey=XXXX
    // O gateways genéricos donde concatenamos el mensaje.
    
    // REGLA: Si la URL del gateway contiene [MESSAGE] o [PHONE], los reemplazamos.
    // Si no, asumimos que se añaden como query params standard (estilo CallMeBot)
    
    if (finalUrl.includes('[MESSAGE]')) {
       finalUrl = finalUrl.replace('[MESSAGE]', encodedMessage).replace('[PHONE]', phone);
    } else {
       // Fallback simple: asume que la URL termina en apikey=xyz y le falta &text=...&phone=...
       const separator = finalUrl.includes('?') ? '&' : '?';
       finalUrl = `${finalUrl}${separator}phone=${phone}&text=${encodedMessage}`;
    }

    const response = UrlFetchApp.fetch(finalUrl);
    Logger.log("WhatsApp enviado a " + phone + ": " + response.getContentText());
    return true;
  } catch (e) {
    Logger.log("Error enviando WhatsApp: " + e.toString());
    return false;
  }
}

// --- GESTIÓN DE SETTINGS ---

function getSettings(ss) {
  if (!ss) ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Settings');
  if (!sheet) return null;

  // Obtenemos los valores. Si la hoja está vacía o fila 2 no existe, manejamos el error.
  const range = sheet.getRange(2, 1, 1, 6);
  const values = range.getValues();
  
  if (!values || values.length === 0 || !values[0]) return null;

  const data = values[0];
  
  return {
    whatsappEnabled: data[0] === true || data[0] === 'TRUE',
    whatsappPhone: data[1],
    whatsappGatewayUrl: data[2],
    daysBeforeWarning: Number(data[3] || 3),
    daysBeforeCritical: Number(data[4] || 1),
    emailEnabled: data[5] === true || data[5] === 'TRUE'
  };
}

function saveSettings(ss, settings) {
  if (!ss) ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Settings');
  
  if (!sheet) {
    sheet = ss.insertSheet('Settings');
    sheet.appendRow(['Enabled', 'Phone', 'GatewayURL', 'WarningDays', 'CriticalDays', 'EmailEnabled']);
  }

  // Guardar en la fila 2 (sobreescribir)
  sheet.getRange(2, 1, 1, 6).setValues([[
    settings.whatsappEnabled,
    settings.whatsappPhone,
    settings.whatsappGatewayUrl,
    settings.daysBeforeWarning,
    settings.daysBeforeCritical,
    settings.emailEnabled
  ]]);
}

// --- FUNCIONES CORE (Existentes + TestSetup) ---

function testSetup() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const result = setupDatabase(ss);
  Logger.log(result);
}

function setupDatabase(ss) {
  if (!ss) ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  const schema = {
    'Payments': ['id', 'storeId', 'storeName', 'userId', 'category', 'specificType', 'amount', 'dueDate', 'paymentDate', 'status', 'notes', 'rejectionReason', 'submittedDate', 'history', 'receiptUrl'],
    'Stores': ['id', 'name', 'location', 'status', 'nextDeadline', 'matrixId'],
    'Users': ['id', 'username', 'role', 'email'],
    'Settings': ['Enabled', 'Phone', 'GatewayURL', 'WarningDays', 'CriticalDays', 'EmailEnabled']
  };

  const created = [];

  for (const [sheetName, headers] of Object.entries(schema)) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(headers); 
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f3f4f6');
      created.push(sheetName);
    }
  }

  return { message: 'Estructura creada/verificada correctamente', sheets: created };
}

function getData(ss, sheetName) {
  if (!ss) ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const data = sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getValues();
  const headers = data.shift();
  
  return data.map(row => {
    let obj = {};
    headers.forEach((header, i) => {
      if ((header === 'history' || header === 'parts') && row[i]) {
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
  if (!ss) ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(header => {
    const val = item[header];
    return (typeof val === 'object') ? JSON.stringify(val) : val;
  });
  sheet.appendRow(row);
}

function updateRow(ss, sheetName, id, updates) {
  if (!ss) ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIndex = headers.indexOf('id');
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIndex]) === String(id)) {
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
  if (!ss) ss = SpreadsheetApp.openById(SPREADSHEET_ID);
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
