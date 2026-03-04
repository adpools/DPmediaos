
'use client';

import { doc, serverTimestamp, Firestore, setDoc } from 'firebase/firestore';

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

  // 1. Create Company Tenant
  const companyRef = doc(db, 'companies', companyId);
  await setDoc(companyRef, {
    id: companyId,
    name: companyName,
    onboardingStatus: 'completed',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // 2. Define Admin Role with Full Module Permissions
  const roleRef = doc(db, 'companies', companyId, 'roles', roleId);
  await setDoc(roleRef, {
    id: roleId,
    company_id: companyId,
    name: 'Admin',
    permissions: {
      dashboard: { view: true, create: true, edit: true, delete: true },
      projects: { view: true, create: true, edit: true, delete: true },
      clients: { view: true, create: true, edit: true, delete: true },
      talents: { view: true, create: true, edit: true, delete: true },
      crm: { view: true, create: true, edit: true, delete: true },
      proposals: { view: true, create: true, edit: true, delete: true },
      invoices: { view: true, create: true, edit: true, delete: true },
      research: { view: true, create: true, edit: true, delete: true },
      reports: { view: true, create: true, edit: true, delete: true },
      admin: { view: true, create: true, edit: true, delete: true },
    }
  });

  // 3. Enable All Request Modules for New Workspaces
  const settingsRef = doc(db, 'companies', companyId, 'company_settings', companyId);
  await setDoc(settingsRef, {
    id: companyId,
    company_id: companyId,
    enabledModules: ['dashboard', 'projects', 'clients', 'talents', 'crm', 'proposals', 'invoices', 'research', 'reports'],
    defaultCurrency: 'USD',
    updatedAt: serverTimestamp(),
  });

  // 4. Establish User Context
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, {
    id: userId,
    company_id: companyId,
    role_id: roleId,
    email,
    fullName: email.split('@')[0],
    status: 'active',
    createdAt: serverTimestamp(),
  }, { merge: true });

  // 5. Special Platform Admin Hook
  if (email === 'arundevv.com@gmail.com') {
    const adminMarkerRef = doc(db, 'super_admins', userId);
    await setDoc(adminMarkerRef, {
      uid: userId,
      email: email,
      granted_at: serverTimestamp()
    }, { merge: true });
  }

  return { companyId };
}
