import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  reload
} from 'firebase/auth';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { auth, db } from './firebase';

// ===== AUTH FUNCTIONS =====

export const signUp = async (email, password, name) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Save user's display name in Auth
    if (name) {
      await updateProfile(user, { displayName: name });
      // Reload to get updated displayName
      await reload(user);
    }

    // Also save user profile to Firestore for reliable retrieval
    await setDoc(doc(db, 'users', user.uid), {
      userId: user.uid,
      email: user.email,
      displayName: name || '',
      createdAt: new Date().toISOString(),
    });

    return user;
  } catch (error) {
    throw error;
  }
};

export const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export const getUserProfile = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

export const resetPassword = async (email) => {
  try {
    const { sendPasswordResetEmail } = await import('firebase/auth');
    await sendPasswordResetEmail(auth, email);
    return 'Password reset email sent! Check your inbox.';
  } catch (error) {
    throw error;
  }
};

export const changePassword = async (newPassword) => {
  try {
    const { updatePassword } = await import('firebase/auth');
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    await updatePassword(user, newPassword);
    return 'Password changed successfully!';
  } catch (error) {
    throw error;
  }
};

// ===== FIRESTORE FUNCTIONS =====

// Save clients
export const saveClients = async (userId, clients) => {
  try {
    // Delete old clients first
    const q = query(collection(db, 'clients'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    for (const docSnap of snapshot.docs) {
      await deleteDoc(docSnap.ref);
    }

    // Save new clients
    for (const client of clients) {
      await addDoc(collection(db, 'clients'), {
        ...client,
        userId
      });
    }
  } catch (error) {
    console.error('Error saving clients:', error);
    throw error;
  }
};

// Load clients
export const loadClients = async (userId) => {
  try {
    const q = query(collection(db, 'clients'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
  } catch (error) {
    console.error('Error loading clients:', error);
    return [];
  }
};

// Save reviews
export const saveReviews = async (userId, reviews) => {
  try {
    const q = query(collection(db, 'reviews'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    for (const docSnap of snapshot.docs) {
      await deleteDoc(docSnap.ref);
    }

    for (const review of reviews) {
      await addDoc(collection(db, 'reviews'), {
        ...review,
        userId
      });
    }
  } catch (error) {
    console.error('Error saving reviews:', error);
    throw error;
  }
};

// Load reviews
export const loadReviews = async (userId) => {
  try {
    const q = query(collection(db, 'reviews'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
  } catch (error) {
    console.error('Error loading reviews:', error);
    return [];
  }
};

// ===== FNA SUMMARY FUNCTIONS =====

// Save FNA Summary (one per client, overwrites previous)
export const saveFNASummary = async (userId, clientId, clientName, extractedData, metrics) => {
  try {
    const summaryRef = doc(db, `users/${userId}/fnaSummaries/${clientId}`);
    await setDoc(summaryRef, {
      clientId,
      clientName,
      extractedData,
      metrics,
      savedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    console.log('FNA Summary saved for client:', clientId);
    return true;
  } catch (error) {
    console.error('Error saving FNA summary:', error);
    throw error;
  }
};

// Load FNA Summary
export const loadFNASummary = async (userId, clientId) => {
  try {
    const summaryRef = doc(db, `users/${userId}/fnaSummaries/${clientId}`);
    const summaryDoc = await getDoc(summaryRef);
    if (summaryDoc.exists()) {
      return summaryDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Error loading FNA summary:', error);
    return null;
  }
};
