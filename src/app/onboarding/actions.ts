
'use client';

import { doc, setDoc, serverTimestamp, Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

/**
 * Handles the creation of a new company and the initial admin user.
 */
export async function setupNewCompany(
  db: Firestore, 
  userId: string, 
  email: string, 
  companyName: string, 
  industry: string
) {
  const companyId = `comp_${Math.random().toString(36).substr(2, 9)}`;
  const roleId = 'admin';

  // 1. Create Company
  const companyRef = doc(db, 'companies', companyId);
  setDocumentNonBlocking(companyRef, {
    id: companyId,
    name: companyName,
    onboardingStatus: 'completed',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });

  // 2. Create Admin Role
  const roleRef = doc(db, 'companies', companyId, 'roles', roleId);
  setDocumentNonBlocking(roleRef, {
    id: roleId,
    companyId,
    name: 'Admin',
    permissions: {
      dashboard: { view: true },
      projects: { view: true, create: true, edit: true, delete: true },
      talents: { view: true, create: true, edit: true, delete: true },
      crm: { view: true, create: true, edit: true, delete: true },
      finance: { view: true, create: true, edit: true, delete: true },
      research: { view: true, create: true, edit: true, delete: true },
      admin: { view: true, create: true, edit: true, delete: true },
    }
  }, { merge: true });

  // 3. Create Company Settings
  const settingsRef = doc(db, 'companies', companyId, 'company_settings', companyId);
  setDocumentNonBlocking(settingsRef, {
    id: companyId,
    companyId,
    enabledModules: ['projects', 'talents', 'crm', 'finance', 'research'],
    defaultCurrency: 'USD',
    updatedAt: serverTimestamp(),
  }, { merge: true });

  // 4. Create User Profile
  const userRef = doc(db, 'users', userId);
  setDocumentNonBlocking(userRef, {
    id: userId,
    companyId,
    roleId,
    email,
    fullName: email.split('@')[0], // Default name
    status: 'active',
    createdAt: serverTimestamp(),
  }, { merge: true });

  return { companyId };
}
