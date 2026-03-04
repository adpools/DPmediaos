'use client';

import { doc, serverTimestamp, Firestore, collection } from 'firebase/firestore';
import { setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

/**
 * Provisions a new company and admin profile with exhaustive module access.
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

  // 1. Establish User Context
  const userRef = doc(db, 'users', userId);
  setDocumentNonBlocking(userRef, {
    id: userId,
    company_id: companyId,
    role_id: roleId,
    email,
    full_name: email.split('@')[0],
    status: 'active',
    created_at: serverTimestamp(),
  }, { merge: true });

  // 2. Create Company Tenant
  const companyRef = doc(db, 'companies', companyId);
  setDocumentNonBlocking(companyRef, {
    id: companyId,
    name: companyName,
    onboarding_status: 'completed',
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  }, { merge: true });

  // 3. Define Admin Role with Full Module Permissions
  const roleRef = doc(db, 'companies', companyId, 'roles', roleId);
  setDocumentNonBlocking(roleRef, {
    id: roleId,
    company_id: companyId,
    name: 'Admin',
    permissions: {
      dashboard: { view: true, create: true, edit: true, delete: true },
      projects: { view: true, create: true, edit: true, delete: true },
      talents: { view: true, create: true, edit: true, delete: true },
      crm: { view: true, create: true, edit: true, delete: true },
      proposals: { view: true, create: true, edit: true, delete: true },
      invoices: { view: true, create: true, edit: true, delete: true, approve: true },
      research: { view: true, create: true, edit: true, delete: true },
      reports: { view: true, create: true, edit: true, delete: true },
      admin: { view: true, create: true, edit: true, delete: true },
    }
  }, { merge: true });

  // 4. Enable All Request Modules for New Workspaces
  const settingsRef = doc(db, 'companies', companyId, 'company_settings', companyId);
  setDocumentNonBlocking(settingsRef, {
    id: companyId,
    company_id: companyId,
    enabled_modules: ['dashboard', 'projects', 'talents', 'crm', 'proposals', 'invoices', 'research', 'reports'],
    default_currency: 'USD',
    updated_at: serverTimestamp(),
  }, { merge: true });

  // 5. Special Platform Admin Hook
  if (email === 'arundevv.com@gmail.com') {
    const adminMarkerRef = doc(db, 'super_admins', userId);
    setDocumentNonBlocking(adminMarkerRef, {
      uid: userId,
      email: email,
      granted_at: serverTimestamp()
    }, { merge: true });
  }

  return { companyId };
}
