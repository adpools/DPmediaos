
'use client';

import { doc, serverTimestamp, Firestore, collection } from 'firebase/firestore';
import { setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

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

  // 2. Create Admin Role with all module permissions
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
      proposals: { view: true, create: true, edit: true, delete: true },
      invoices: { view: true, create: true, edit: true, delete: true, approve: true },
      research: { view: true, create: true, edit: true, delete: true },
      reports: { view: true },
      admin: { view: true, create: true, edit: true, delete: true },
    }
  }, { merge: true });

  // 3. Create Company Settings
  const settingsRef = doc(db, 'companies', companyId, 'company_settings', companyId);
  setDocumentNonBlocking(settingsRef, {
    id: companyId,
    companyId,
    enabledModules: ['dashboard', 'projects', 'talents', 'crm', 'proposals', 'invoices', 'research', 'reports'],
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
    fullName: email.split('@')[0],
    status: 'active',
    createdAt: serverTimestamp(),
  }, { merge: true });

  // 5. Seed initial lead
  const leadsRef = collection(db, 'companies', companyId, 'leads');
  addDocumentNonBlocking(leadsRef, {
    companyId,
    companyName: 'Sample Client Corp',
    contactPerson: 'Jane Doe',
    industry: 'Technology',
    email: 'jane@sample.com',
    stage: 'lead',
    dealValue: 50000,
    createdAt: serverTimestamp(),
  });

  return { companyId };
}
