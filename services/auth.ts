
import { Role, User } from '../types';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const authService = {
  login: async (email: string, password: string): Promise<User> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Get user profile from Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (userDoc.exists()) {
        return { id: firebaseUser.uid, ...userDoc.data() } as User;
      } else {
        // If user exists in Auth but not in Firestore, create a default profile
        const defaultUser: User = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || email.split('@')[0],
          email: firebaseUser.email || email,
          role: Role.ADMIN, // Default role
          avatar: firebaseUser.photoURL || null
        };
        await setDoc(doc(db, 'users', firebaseUser.uid), defaultUser);
        return defaultUser;
      }
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        throw new Error('Credenciales incorrectas.');
      }
      throw new Error(error.message || 'Error al iniciar sesión.');
    }
  },

  logout: async () => {
    await signOut(auth);
  },

  recoverPassword: async (email: string): Promise<string> => {
    try {
      await sendPasswordResetEmail(auth, email);
      return `Se ha enviado un correo de recuperación a ${email}`;
    } catch (error: any) {
      console.error('Recovery error:', error);
      return `Se ha enviado un correo de recuperación a ${email}`;
    }
  },

  onAuthStateChanged: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          callback({ id: firebaseUser.uid, ...userDoc.data() } as User);
        } else {
          // If user exists in Auth but not in Firestore, create a default profile
          const defaultUser: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario',
            email: firebaseUser.email || '',
            role: Role.ADMIN,
            avatar: firebaseUser.photoURL || null
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), defaultUser);
          callback(defaultUser);
        }
      } else {
        callback(null);
      }
    });
  }
};
