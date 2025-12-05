
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updateProfile
} from "firebase/auth";
import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  updateDoc, 
  deleteDoc,
  query,
  limit 
} from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { User } from "../types";

export const authService = {
  login: async (email: string, password: string): Promise<User> => {
    // 1. Autenticar con Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // 2. Obtener datos extra del usuario (rol, aprobación) de Firestore
    const userDocRef = doc(db, "users", firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      // Caso raro: Usuario en Auth pero no en Firestore (ej: error en registro previo)
      // Intentar recuperar/crear perfil básico si no existe
      await signOut(auth);
      throw new Error("Perfil de usuario no encontrado. Contacte al administrador.");
    }

    const userData = userDoc.data() as User;

    // 3. Verificar aprobación
    if (!userData.isApproved) {
      await signOut(auth);
      throw new Error('Tu cuenta está pendiente de aprobación por el administrador.');
    }

    return userData;
  },

  register: async (name: string, email: string, password: string): Promise<User> => {
    // 1. Crear usuario en Firebase Auth PRIMERO
    // Esto nos da un token válido (request.auth) para poder leer la BD según las reglas
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // 2. Comprobar si hay usuarios en la BD (ahora ya estamos logueados)
    // Buscamos si existe AL MENOS un documento en la colección users
    const usersRef = collection(db, "users");
    const q = query(usersRef, limit(1));
    const snapshot = await getDocs(q);
    const isFirstUser = snapshot.empty;

    // 3. Guardar perfil extendido en Firestore
    const newUser: User = {
      id: firebaseUser.uid,
      name: name,
      email: email,
      role: isFirstUser ? 'admin' : 'user',
      isApproved: isFirstUser ? true : false
    };

    try {
        await setDoc(doc(db, "users", firebaseUser.uid), newUser);
        await updateProfile(firebaseUser, { displayName: name });
    } catch (error) {
        // Si falla el guardado en Firestore, deberíamos borrar el usuario de Auth para no dejar "zombies"
        // pero por simplicidad lanzamos el error.
        console.error("Error guardando perfil en Firestore", error);
        throw error;
    }

    return newUser;
  },

  logout: async () => {
    await signOut(auth);
  },

  // --- Métodos de Administración ---

  getAllUsers: async (): Promise<User[]> => {
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);
    return snapshot.docs.map(doc => doc.data() as User);
  },

  approveUser: async (userId: string): Promise<void> => {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { isApproved: true });
  },

  suspendUser: async (userId: string): Promise<void> => {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { isApproved: false });
  },

  deleteUser: async (userId: string): Promise<void> => {
    // Nota: Esto borra el doc de Firestore, pero el usuario de Auth sigue existiendo
    // en esta implementación simple del lado del cliente. 
    const userRef = doc(db, "users", userId);
    await deleteDoc(userRef);
  }
};
