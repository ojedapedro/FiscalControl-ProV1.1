/**
 * FiscalCtl Pro - Google Apps Script Backend
 * 
 * INSTRUCCIONES DE DESPLIEGUE:
 * 1. Ve a https://script.google.com/ y crea un nuevo proyecto.
 * 2. Pega todo este código en el archivo Code.gs.
 * 3. Haz clic en "Implementar" > "Nueva implementación".
 * 4. Selecciona el tipo "Aplicación web".
 * 5. Configura:
 *    - Ejecutar como: "Yo"
 *    - Quién tiene acceso: "Cualquier persona"
 * 6. Haz clic en "Implementar" y autoriza los permisos.
 * 7. Copia la "URL de la aplicación web" y pégala en tu archivo services/api.ts en la variable API_URL.
 */

const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders(HEADERS);
}

function response(data, isError = false) {
  const res = {
    status: isError ? 'error' : 'success',
    ...data
  };
  return ContentService.createTextOutput(JSON.stringify(res))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(HEADERS);
}

function doGet(e) {
  const action = e.parameter.action;
  
  try {
    switch (action) {
      case 'getPayments':
        return response({ data: getPayments() });
      case 'getUsers':
        return response({ data: getUsers() });
      case 'getSettings':
        return response({ data: getSettings() });
      case 'getEmployees':
        return response({ data: getEmployees() });
      default:
        return response({ message: 'Acción GET no válida o no especificada' }, true);
    }
  } catch (error) {
    return response({ message: error.toString() }, true);
  }
}

function doPost(e) {
  const action = e.parameter.action;
  let data = {};
  
  if (e.postData && e.postData.contents) {
    try {
      data = JSON.parse(e.postData.contents);
    } catch (err) {
      // Ignorar error de parseo si no hay body
    }
  }

  try {
    switch (action) {
      case 'setup':
        return response({ message: setupDatabase() });
      case 'addPayment':
        return response({ message: addPayment(data) });
      case 'updatePayment':
        return response({ message: updatePayment(data) });
      case 'deletePayment':
        return response({ message: deletePayment(data.id) });
      case 'addUser':
        return response({ message: addUser(data) });
      case 'saveSettings':
        return response({ message: saveSettings(data) });
      case 'addEmployee':
        return response({ message: addEmployee(data) });
      case 'updateEmployee':
        return response({ message: updateEmployee(data) });
      case 'deleteEmployee':
        return response({ message: deleteEmployee(data.id) });
      case 'checkNotifications':
        return response({ message: 'Notificaciones revisadas' });
      default:
        return response({ message: 'Acción POST no válida' }, true);
    }
  } catch (error) {
    return response({ message: error.toString() }, true);
  }
}

// ==========================================
// SETUP DATABASE
// ==========================================
function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const sheets = {
    'Pagos': ['id', 'storeId', 'storeName', 'userId', 'category', 'specificType', 'amount', 'dueDate', 'paymentDate', 'status', 'receiptUrl', 'notes', 'rejectionReason', 'submittedDate', 'history', 'originalBudget', 'isOverBudget', 'justification', 'justificationFileUrl'],
    'Usuarios': ['id', 'name', 'email', 'role', 'avatar', 'password'],
    'Configuracion': ['key', 'value'],
    'Empleados': ['id', 'name', 'position', 'department', 'hireDate', 'baseSalary', 'isActive', 'bankAccount', 'defaultBonuses', 'defaultDeductions', 'defaultEmployerLiabilities']
  };

  for (const [sheetName, headers] of Object.entries(sheets)) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(headers);
      // Dar formato a los encabezados
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f4f6");
      sheet.setFrozenRows(1);
    }
  }
  
  // Configuración por defecto si está vacía
  const configSheet = ss.getSheetByName('Configuracion');
  if (configSheet.getLastRow() <= 1) {
    const defaultSettings = {
      whatsappEnabled: false,
      whatsappPhone: '',
      whatsappGatewayUrl: '',
      daysBeforeWarning: 5,
      daysBeforeCritical: 2,
      emailEnabled: false,
      exchangeRate: 1
    };
    for (const [key, value] of Object.entries(defaultSettings)) {
      configSheet.appendRow([key, JSON.stringify(value)]);
    }
  }

  return 'Base de datos inicializada correctamente';
}

// ==========================================
// PAGOS
// ==========================================
function getPayments() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Pagos');
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  const headers = data[0];
  const payments = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const payment = {};
    for (let j = 0; j < headers.length; j++) {
      let val = row[j];
      if (headers[j] === 'history' && val) {
        try { val = JSON.parse(val); } catch(e) { val = []; }
      }
      if (headers[j] === 'amount' || headers[j] === 'originalBudget') {
        val = val ? Number(val) : undefined;
      }
      if (headers[j] === 'isOverBudget') {
        val = val === true || val === 'true';
      }
      payment[headers[j]] = val;
    }
    payments.push(payment);
  }
  return payments;
}

function addPayment(payment) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Pagos');
  if (!sheet) throw new Error("La hoja 'Pagos' no existe. Ejecuta setup primero.");
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const rowData = headers.map(header => {
    let val = payment[header];
    if (header === 'history') val = JSON.stringify(val || []);
    return val !== undefined ? val : '';
  });
  
  sheet.appendRow(rowData);
  return 'Pago agregado correctamente';
}

function updatePayment(payment) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Pagos');
  if (!sheet) throw new Error("La hoja 'Pagos' no existe.");
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === payment.id) {
      const rowData = headers.map(header => {
        let val = payment[header];
        if (header === 'history') val = JSON.stringify(val || []);
        return val !== undefined ? val : '';
      });
      sheet.getRange(i + 1, 1, 1, headers.length).setValues([rowData]);
      return 'Pago actualizado correctamente';
    }
  }
  throw new Error("Pago no encontrado");
}

function deletePayment(id) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Pagos');
  if (!sheet) throw new Error("La hoja 'Pagos' no existe.");
  
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      return 'Pago eliminado correctamente';
    }
  }
  throw new Error("Pago no encontrado");
}

// ==========================================
// EMPLEADOS (NÓMINA)
// ==========================================
function getEmployees() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Empleados');
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  const headers = data[0];
  const employees = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const employee = {};
    for (let j = 0; j < headers.length; j++) {
      let val = row[j];
      // Parsear JSON para arrays de bonos y deducciones
      if (['defaultBonuses', 'defaultDeductions', 'defaultEmployerLiabilities'].includes(headers[j])) {
        try { val = val ? JSON.parse(val) : []; } catch(e) { val = []; }
      }
      if (headers[j] === 'baseSalary') val = Number(val) || 0;
      if (headers[j] === 'isActive') val = (val === true || val === 'true');
      
      employee[headers[j]] = val;
    }
    employees.push(employee);
  }
  return employees;
}

function addEmployee(employee) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Empleados');
  if (!sheet) throw new Error("La hoja 'Empleados' no existe. Ejecuta setup primero.");
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const rowData = headers.map(header => {
    let val = employee[header];
    if (['defaultBonuses', 'defaultDeductions', 'defaultEmployerLiabilities'].includes(header)) {
      val = JSON.stringify(val || []);
    }
    return val !== undefined ? val : '';
  });
  
  sheet.appendRow(rowData);
  return 'Empleado agregado correctamente';
}

function updateEmployee(employee) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Empleados');
  if (!sheet) throw new Error("La hoja 'Empleados' no existe.");
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === employee.id) {
      const rowData = headers.map(header => {
        let val = employee[header];
        if (['defaultBonuses', 'defaultDeductions', 'defaultEmployerLiabilities'].includes(header)) {
          val = JSON.stringify(val || []);
        }
        return val !== undefined ? val : '';
      });
      sheet.getRange(i + 1, 1, 1, headers.length).setValues([rowData]);
      return 'Empleado actualizado correctamente';
    }
  }
  throw new Error("Empleado no encontrado");
}

function deleteEmployee(id) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Empleados');
  if (!sheet) throw new Error("La hoja 'Empleados' no existe.");
  
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      return 'Empleado eliminado correctamente';
    }
  }
  throw new Error("Empleado no encontrado");
}

// ==========================================
// USUARIOS
// ==========================================
function getUsers() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Usuarios');
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  const headers = data[0];
  const users = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const user = {};
    for (let j = 0; j < headers.length; j++) {
      user[headers[j]] = row[j];
    }
    users.push(user);
  }
  return users;
}

function addUser(user) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Usuarios');
  if (!sheet) throw new Error("La hoja 'Usuarios' no existe.");
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const rowData = headers.map(header => user[header] !== undefined ? user[header] : '');
  
  sheet.appendRow(rowData);
  return 'Usuario agregado correctamente';
}

// ==========================================
// CONFIGURACIÓN
// ==========================================
function getSettings() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Configuracion');
  if (!sheet) return {};
  
  const data = sheet.getDataRange().getValues();
  const settings = {};
  
  for (let i = 1; i < data.length; i++) {
    const key = data[i][0];
    let val = data[i][1];
    try { val = JSON.parse(val); } catch(e) {}
    settings[key] = val;
  }
  return settings;
}

function saveSettings(settings) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Configuracion');
  if (!sheet) throw new Error("La hoja 'Configuracion' no existe.");
  
  // Limpiar hoja y reescribir
  sheet.clear();
  sheet.appendRow(['key', 'value']);
  
  for (const [key, value] of Object.entries(settings)) {
    sheet.appendRow([key, JSON.stringify(value)]);
  }
  return 'Configuración guardada correctamente';
}
