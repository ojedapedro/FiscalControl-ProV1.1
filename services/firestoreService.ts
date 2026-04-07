
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  getDocFromServer,
  limit,
  startAfter
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Payment, SystemSettings, User, BudgetEntry, Employee, PayrollEntry, Store } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Helper to remove undefined values from objects before sending to Firestore
export function cleanObject(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj
      .filter(item => item !== undefined)
      .map(item => cleanObject(item));
  }

  const newObj: any = {};
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (value !== undefined) {
      const cleaned = cleanObject(value);
      if (cleaned !== undefined) {
        newObj[key] = cleaned;
      }
    }
  });
  return newObj;
}

// Test connection
export async function testConnection() {
  if (!auth.currentUser) {
    console.log("Firestore connection test skipped: User not authenticated.");
    return;
  }
  try {
    const docRef = doc(db, 'test', 'connection');
    const docSnap = await getDocFromServer(docRef);
    if (docSnap.exists()) {
      console.log("Firestore connection successful (document exists).");
    } else {
      console.log("Firestore connection successful (document does not exist, but read is allowed).");
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('permission-denied')) {
      console.error("Firestore connection test failed: Missing or insufficient permissions. Please ensure security rules are published.");
    } else if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Firestore connection test failed: The client is offline. Please check your Firebase configuration or internet connection.");
    } else {
      console.error("Firestore connection test failed with an unexpected error:", error);
    }
  }
}

export const firestoreService = {
  // Users
  getUsers: async (): Promise<User[]> => {
    const path = 'users';
    try {
      const snapshot = await getDocs(collection(db, path));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  createUser: async (user: User) => {
    const path = `users/${user.id}`;
    try {
      await setDoc(doc(db, 'users', user.id), cleanObject(user));
      return { status: 'success' };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  updateUser: async (user: User) => {
    const path = `users/${user.id}`;
    try {
      await updateDoc(doc(db, 'users', user.id), cleanObject(user));
      return { status: 'success' };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  deleteUser: async (id: string) => {
    const path = `users/${id}`;
    try {
      await deleteDoc(doc(db, 'users', id));
      return { status: 'success' };
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // Payments
  getPayments: async (limitCount?: number, lastDoc?: any): Promise<{ payments: Payment[], lastVisible: any }> => {
    const path = 'payments';
    try {
      let q = query(collection(db, path), orderBy('submittedDate', 'desc'));
      if (limitCount) {
        q = query(q, limit(limitCount));
      }
      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }
      const snapshot = await getDocs(q);
      const payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      return { payments, lastVisible };
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return { payments: [], lastVisible: null };
    }
  },

  subscribeToPayments: (callback: (payments: Payment[]) => void) => {
    const path = 'payments';
    return onSnapshot(query(collection(db, path), orderBy('submittedDate', 'desc')), (snapshot) => {
      const payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
      callback(payments);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  createPayment: async (payment: Payment) => {
    const path = `payments/${payment.id}`;
    try {
      await setDoc(doc(db, 'payments', payment.id), cleanObject(payment));
      return { status: 'success' };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  updatePayment: async (payment: Payment) => {
    const path = `payments/${payment.id}`;
    try {
      await updateDoc(doc(db, 'payments', payment.id), cleanObject(payment));
      return { status: 'success' };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  deletePayment: async (id: string) => {
    const path = `payments/${id}`;
    try {
      await deleteDoc(doc(db, 'payments', id));
      return { status: 'success' };
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // Employees
  getEmployees: async (limitCount?: number, lastDoc?: any): Promise<{ employees: Employee[], lastVisible: any }> => {
    const path = 'employees';
    try {
      let q = query(collection(db, path), orderBy('lastName', 'asc'));
      if (limitCount) {
        q = query(q, limit(limitCount));
      }
      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }
      const snapshot = await getDocs(q);
      const employees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      return { employees, lastVisible };
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return { employees: [], lastVisible: null };
    }
  },

  createEmployee: async (employee: Employee) => {
    const path = `employees/${employee.id}`;
    try {
      await setDoc(doc(db, 'employees', employee.id), cleanObject(employee));
      return { status: 'success' };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  updateEmployee: async (employee: Employee) => {
    const path = `employees/${employee.id}`;
    try {
      await updateDoc(doc(db, 'employees', employee.id), cleanObject(employee));
      return { status: 'success' };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  deleteEmployee: async (id: string) => {
    const path = `employees/${id}`;
    try {
      await deleteDoc(doc(db, 'employees', id));
      return { status: 'success' };
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // Payroll
  getPayrollEntries: async (limitCount?: number, lastDoc?: any): Promise<{ entries: PayrollEntry[], lastVisible: any }> => {
    const path = 'payroll';
    try {
      let q = query(collection(db, path), orderBy('submittedDate', 'desc'));
      if (limitCount) {
        q = query(q, limit(limitCount));
      }
      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }
      const snapshot = await getDocs(q);
      const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PayrollEntry));
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      return { entries, lastVisible };
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return { entries: [], lastVisible: null };
    }
  },

  createPayrollEntry: async (entry: PayrollEntry) => {
    const path = `payroll/${entry.id}`;
    try {
      await setDoc(doc(db, 'payroll', entry.id), cleanObject(entry));
      return { status: 'success' };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  updatePayrollEntry: async (entry: PayrollEntry) => {
    const path = `payroll/${entry.id}`;
    try {
      await updateDoc(doc(db, 'payroll', entry.id), cleanObject(entry));
      return { status: 'success' };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  deletePayrollEntry: async (id: string) => {
    const path = `payroll/${id}`;
    try {
      await deleteDoc(doc(db, 'payroll', id));
      return { status: 'success' };
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // Budgets
  getBudgets: async (): Promise<BudgetEntry[]> => {
    try {
      const budgetsRef = collection(db, 'budgets');
      const annualBudgetsRef = collection(db, 'annual_budgets');
      
      const [budgetsSnap, annualBudgetsSnap] = await Promise.all([
        getDocs(budgetsRef),
        getDocs(annualBudgetsRef)
      ]);
      
      const budgets = budgetsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as BudgetEntry));
      const annualBudgets = annualBudgetsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as BudgetEntry));
      
      // Merge and deduplicate by ID
      const allBudgets = [...budgets];
      annualBudgets.forEach(ab => {
        if (!allBudgets.find(b => b.id === ab.id)) {
          allBudgets.push(ab);
        }
      });
      
      return allBudgets;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'budgets');
      return [];
    }
  },

  createBudget: async (budget: BudgetEntry) => {
    const path = `budgets/${budget.id}`;
    try {
      await setDoc(doc(db, 'budgets', budget.id), cleanObject(budget));
      return { status: 'success' };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  deleteBudget: async (id: string) => {
    const path = `budgets/${id}`;
    try {
      await deleteDoc(doc(db, 'budgets', id));
      return { status: 'success' };
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // Settings
  getSettings: async (): Promise<SystemSettings | null> => {
    const path = 'settings/global';
    try {
      const docRef = doc(db, 'settings', 'global');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as SystemSettings;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  saveSettings: async (settings: SystemSettings) => {
    const path = 'settings/global';
    try {
      await setDoc(doc(db, 'settings', 'global'), cleanObject(settings));
      return { status: 'success' };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  bootstrap: async () => {
    try {
      await testConnection();
      const settings = await firestoreService.getSettings();
      if (!settings) {
        const defaultSettings: SystemSettings = {
          whatsappEnabled: false,
          whatsappPhone: '',
          whatsappGatewayUrl: '',
          daysBeforeWarning: 7,
          daysBeforeCritical: 3,
          emailEnabled: false,
          exchangeRate: 1,
          pushEnabled: false,
          notifyPending: true,
          notifyOverdue: true,
          refreshInterval: 30000
        };
        await firestoreService.saveSettings(defaultSettings);
        console.log("System settings bootstrapped successfully.");
      }
    } catch (error) {
      console.error("Error during bootstrap:", error);
    }
  },

  // --- EXCHANGE RATES ---
  getExchangeRateByDate: async (date: string) => {
    try {
      const docRef = doc(db, 'exchange_rates', date);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { success: true, rate: docSnap.data().rate };
      }
      return { success: true, rate: null };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `exchange_rates/${date}`);
      return { success: false, rate: null };
    }
  },

  saveExchangeRate: async (rate: number, date?: string) => {
    const targetDate = date || new Date().toISOString().split('T')[0];
    try {
      await setDoc(doc(db, 'exchange_rates', targetDate), cleanObject({
        date: targetDate,
        rate: rate
      }));
      return { success: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `exchange_rates/${targetDate}`);
      return { success: false };
    }
  },

  // --- STORES ---
  getStores: async (): Promise<Store[]> => {
    const path = 'stores';
    try {
      const snapshot = await getDocs(collection(db, path));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Store));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  createStore: async (store: Store) => {
    const path = `stores/${store.id}`;
    try {
      await setDoc(doc(db, 'stores', store.id), cleanObject(store));
      return { status: 'success' };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  updateStore: async (store: Store) => {
    const path = `stores/${store.id}`;
    try {
      await updateDoc(doc(db, 'stores', store.id), cleanObject(store));
      return { status: 'success' };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  deleteStore: async (id: string) => {
    const path = `stores/${id}`;
    try {
      await deleteDoc(doc(db, 'stores', id));
      return { status: 'success' };
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
};
