
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
  getDocFromServer
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Payment, SystemSettings, User, BudgetEntry, Employee, PayrollEntry } from '../types';

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

// Test connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection successful.");
  } catch (error) {
    console.error("Firestore connection test failed:", error);
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
testConnection();

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
      await setDoc(doc(db, 'users', user.id), user);
      return { status: 'success' };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  updateUser: async (user: User) => {
    const path = `users/${user.id}`;
    try {
      await updateDoc(doc(db, 'users', user.id), { ...user });
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
  getPayments: async (): Promise<Payment[]> => {
    const path = 'payments';
    try {
      const snapshot = await getDocs(query(collection(db, path), orderBy('submittedDate', 'desc')));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
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
      await setDoc(doc(db, 'payments', payment.id), payment);
      return { status: 'success' };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  updatePayment: async (payment: Payment) => {
    const path = `payments/${payment.id}`;
    try {
      await updateDoc(doc(db, 'payments', payment.id), { ...payment });
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
  getEmployees: async (): Promise<Employee[]> => {
    const path = 'employees';
    try {
      const snapshot = await getDocs(collection(db, path));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  createEmployee: async (employee: Employee) => {
    const path = `employees/${employee.id}`;
    try {
      await setDoc(doc(db, 'employees', employee.id), employee);
      return { status: 'success' };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  updateEmployee: async (employee: Employee) => {
    const path = `employees/${employee.id}`;
    try {
      await updateDoc(doc(db, 'employees', employee.id), { ...employee });
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
  getPayrollEntries: async (): Promise<PayrollEntry[]> => {
    const path = 'payroll';
    try {
      const snapshot = await getDocs(query(collection(db, path), orderBy('submittedDate', 'desc')));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PayrollEntry));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  createPayrollEntry: async (entry: PayrollEntry) => {
    const path = `payroll/${entry.id}`;
    try {
      await setDoc(doc(db, 'payroll', entry.id), entry);
      return { status: 'success' };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  updatePayrollEntry: async (entry: PayrollEntry) => {
    const path = `payroll/${entry.id}`;
    try {
      await updateDoc(doc(db, 'payroll', entry.id), { ...entry });
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
    const path = 'budgets';
    try {
      const snapshot = await getDocs(collection(db, path));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BudgetEntry));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  createBudget: async (budget: BudgetEntry) => {
    const path = `budgets/${budget.id}`;
    try {
      await setDoc(doc(db, 'budgets', budget.id), budget);
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
      await setDoc(doc(db, 'settings', 'global'), settings);
      return { status: 'success' };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
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
      await setDoc(doc(db, 'exchange_rates', targetDate), {
        date: targetDate,
        rate: rate
      });
      return { success: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `exchange_rates/${targetDate}`);
      return { success: false };
    }
  }
};
