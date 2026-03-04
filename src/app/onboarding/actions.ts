'use client';

import { doc, serverTimestamp, Firestore, collection } from 'firebase/firestore';
import { setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

/**
 * Handles the creation of a new company and the initial admin user.
 * Standardizes on snake_case fields as per PRD requirements.
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

  // 1. Create User Profile FIRST to establish company_id link for Security Rules
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

  // 2. Create Company
  const companyRef = doc(db, 'companies', companyId);
  setDocumentNonBlocking(companyRef, {
    id: companyId,
    name: companyName,
    onboarding_status: 'completed',
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  }, { merge: true });

  // 3. Create Admin Role with all module permissions
  const roleRef = doc(db, 'companies', companyId, 'roles', roleId);
  setDocumentNonBlocking(roleRef, {
    id: roleId,
    company_id: companyId,
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

  // 4. Create Company Settings
  const settingsRef = doc(db, 'companies', companyId, 'company_settings', companyId);
  setDocumentNonBlocking(settingsRef, {
    id: companyId,
    company_id: companyId,
    enabled_modules: ['dashboard', 'projects', 'talents', 'crm', 'proposals', 'invoices', 'research', 'reports'],
    default_currency: 'USD',
    updated_at: serverTimestamp(),
  }, { merge: true });

  // 5. Seed initial lead
  const leadsRef = collection(db, 'companies', companyId, 'leads');
  addDocumentNonBlocking(leadsRef, {
    company_id: companyId,
    company_name: 'Sample Client Corp',
    contact_person: 'Jane Doe',
    industry: industry || 'Media',
    email: 'jane@sample.com',
    stage: 'lead',
    deal_value: 50000,
    created_at: serverTimestamp(),
  });

  return { companyId };
}
