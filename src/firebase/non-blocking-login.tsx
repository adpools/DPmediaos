'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
  UserCredential,
  User,
} from 'firebase/auth';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): Promise<UserCredential> {
  return signInAnonymously(authInstance);
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): Promise<UserCredential> {
  return createUserWithEmailAndPassword(authInstance, email, password);
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): Promise<UserCredential> {
  return signInWithEmailAndPassword(authInstance, email, password);
}

/** 
 * Initiate password reset email (non-blocking). 
 * Includes a continue URL to return the user to the login page.
 */
export function initiatePasswordReset(authInstance: Auth, email: string): Promise<void> {
  const actionCodeSettings = {
    // URL to redirect back to. The domain must be authorized in the Firebase Console.
    url: typeof window !== 'undefined' ? `${window.location.origin}/login` : '',
    handleCodeInApp: false,
  };
  return sendPasswordResetEmail(authInstance, email, actionCodeSettings);
}

/** Update the password for the currently signed-in user. */
export function performPasswordUpdate(user: User, newPassword: string): Promise<void> {
  return updatePassword(user, newPassword);
}
