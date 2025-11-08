import { initializeApp, getApp, getApps, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type Auth,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import type { UserProfile } from '../types';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
} satisfies Partial<FirebaseOptions>;

const requiredKeys: Array<[string, string | undefined]> = [
  ['apiKey', firebaseConfig.apiKey],
  ['authDomain', firebaseConfig.authDomain],
  ['projectId', firebaseConfig.projectId],
  ['storageBucket', firebaseConfig.storageBucket],
  ['messagingSenderId', firebaseConfig.messagingSenderId],
  ['appId', firebaseConfig.appId],
];

const missingKeys = requiredKeys.filter(([, value]) => !value).map(([key]) => key);

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firestore: Firestore | null = null;
let firebaseStorage: FirebaseStorage | null = null;

if (missingKeys.length === 0) {
  const options = firebaseConfig as FirebaseOptions;
  firebaseApp = getApps().length === 0 ? initializeApp(options) : getApp();
  firebaseAuth = getAuth(firebaseApp);
  firestore = getFirestore(firebaseApp);
  firebaseStorage = getStorage(firebaseApp);
} else {
  console.warn(
    `Firebase configuration is incomplete. Missing values: ${missingKeys.join(', ')}. Authentication features will be disabled until configuration is provided.`,
  );
}

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

export const googleAuthProvider = provider;

const ensureFirebaseReady = (): { auth: Auth; db: Firestore } => {
  if (!firebaseAuth || !firestore) {
    throw new Error(
      'Firebase is not configured. Please provide the required VITE_FIREBASE_* environment variables and restart the app.',
    );
  }
  return { auth: firebaseAuth, db: firestore };
};

export const getAuthInstance = (): Auth => ensureFirebaseReady().auth;
export const getFirestoreInstance = (): Firestore => ensureFirebaseReady().db;
export const getStorageInstance = (): FirebaseStorage => {
  if (!firebaseStorage) {
    throw new Error('Firebase Storage is not configured.');
  }
  return firebaseStorage;
};

const isTimestampLike = (value: unknown): value is { toDate: () => Date } => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as { toDate?: unknown };
  return typeof candidate.toDate === 'function';
};

const convertToIsoString = (value: unknown): string | undefined => {
  if (isTimestampLike(value)) {
    return value.toDate().toISOString();
  }
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  return undefined;
};

const pickStoredString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const buildUserProfile = (user: User, data?: DocumentData | null): UserProfile => {
  const storedDisplayName = pickStoredString(data?.displayName);
  const storedEmail = pickStoredString(data?.email);
  const storedPhotoUrl = pickStoredString(data?.photoURL);

  return {
    uid: user.uid,
    displayName: user.displayName ?? storedDisplayName,
    email: user.email ?? storedEmail,
    photoURL: user.photoURL ?? storedPhotoUrl,
    createdAt: convertToIsoString(data?.createdAt),
    lastLoginAt: convertToIsoString(data?.lastLoginAt),
  };
};

const upsertUserProfile = async (user: User): Promise<UserProfile> => {
  const { db } = ensureFirebaseReady();
  const userRef = doc(db, 'users', user.uid);
  const existingSnapshot = await getDoc(userRef);
  const existingData = existingSnapshot.data();

  if (!existingSnapshot.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      displayName: user.displayName ?? null,
      email: user.email ?? null,
      photoURL: user.photoURL ?? null,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });
  } else {
    await setDoc(
      userRef,
      {
        displayName: user.displayName ?? (typeof existingData?.displayName === 'string' ? existingData.displayName : null),
        email: user.email ?? (typeof existingData?.email === 'string' ? existingData.email : null),
        photoURL: user.photoURL ?? (typeof existingData?.photoURL === 'string' ? existingData.photoURL : null),
        lastLoginAt: serverTimestamp(),
      },
      { merge: true },
    );
  }

  const updatedSnapshot = await getDoc(userRef);
  return buildUserProfile(user, updatedSnapshot.data());
};

export interface GoogleSignInResult {
  profile: UserProfile;
  accessToken: string | null;
}

const extractAccessToken = (result: Awaited<ReturnType<typeof signInWithPopup>>): string | null => {
  const credential = GoogleAuthProvider.credentialFromResult(result);
  return credential?.accessToken ?? null;
};

export const signInWithGoogle = async (): Promise<GoogleSignInResult> => {
  const authInstance = getAuthInstance();
  const signInResult = await signInWithPopup(authInstance, provider);
  const profile = await upsertUserProfile(signInResult.user);

  return {
    profile,
    accessToken: extractAccessToken(signInResult),
  };
};

export const signInWithGoogleRedirect = async (): Promise<void> => {
  const authInstance = getAuthInstance();
  await signInWithRedirect(authInstance, provider);
};

export const signOutUser = async (): Promise<void> => {
  const { auth } = ensureFirebaseReady();
  await signOut(auth);
};

export const listenToUserProfileChanges = (
  handler: (profile: UserProfile | null) => void,
): (() => void) => {
  if (!firebaseAuth) {
    queueMicrotask(() => handler(null));
    return () => undefined;
  }

  return onAuthStateChanged(firebaseAuth, (user) => {
    if (!user) {
      handler(null);
      return;
    }

    upsertUserProfile(user)
      .then((profile) => handler(profile))
      .catch((error) => {
        console.error('Failed to synchronize user profile with Firestore.', error);
        handler(null);
      });
  });
};

export const isFirebaseConfigured = (): boolean => firebaseAuth !== null && firestore !== null;

export type { UserProfile };
