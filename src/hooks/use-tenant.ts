'use client';

import { useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

/**
 * Hook to get the current user's company and role context.
 * Standardized on snake_case fields (company_id, role_id) to match blueprint.
 */
export function useTenant() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const db = useFirestore();

  // 1. Get the User Profile from Firestore
  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  // 2. Get the Company data
  const companyRef = useMemoFirebase(() => {
    const cId = profile?.company_id || (profile as any)?.companyId;
    if (!db || !cId) return null;
    return doc(db, 'companies', cId);
  }, [db, profile]);

  const { data: company, isLoading: isCompanyLoading } = useDoc(companyRef);

  // 3. Get the Role permissions
  const roleRef = useMemoFirebase(() => {
    const cId = profile?.company_id || (profile as any)?.companyId;
    const rId = profile?.role_id || (profile as any)?.roleId;
    if (!db || !cId || !rId) return null;
    return doc(db, 'companies', cId, 'roles', rId);
  }, [db, profile]);

  const { data: role, isLoading: isRoleLoading } = useDoc(roleRef);

  // 4. Get Company Settings
  const settingsRef = useMemoFirebase(() => {
    const cId = profile?.company_id || (profile as any)?.companyId;
    if (!db || !cId) return null;
    return doc(db, 'companies', cId, 'company_settings', cId);
  }, [db, profile]);

  const { data: settings, isLoading: isSettingsLoading } = useDoc(settingsRef);

  // 5. Get Super Admin Marker
  const superAdminRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'super_admins', user.uid);
  }, [db, user?.uid]);

  const { data: superAdmin, isLoading: isSuperAdminLoading } = useDoc(superAdminRef);

  const isLoading = isAuthLoading || isProfileLoading || isSuperAdminLoading;
  
  // Secondary loading states are only relevant if we have a company_id
  const hasContext = !!(profile?.company_id || (profile as any)?.companyId);
  const isContextLoading = hasContext && (isCompanyLoading || isRoleLoading || isSettingsLoading);

  // Combined Super Admin check including hardcoded bootstrap email
  const isSuperAdminValue = !!superAdmin || user?.email === 'arundevv.com@gmail.com';

  /**
   * Checks if the user has a specific permission for a module.
   */
  const hasPermission = (module: string, action: 'view' | 'create' | 'edit' | 'delete' | 'approve' = 'view') => {
    if (isSuperAdminValue || profile?.role_id === 'admin' || (profile as any)?.roleId === 'admin') return true;
    if (!role?.permissions) return false;
    const perms = role.permissions[module];
    return perms ? perms[action] : false;
  };

  /**
   * Checks if a module is enabled globally for the company.
   */
  const isModuleEnabled = (moduleName: string) => {
    if (isSuperAdminValue) return true;
    if (!settings) return ['dashboard', 'projects'].includes(moduleName);
    return settings?.enabledModules?.includes(moduleName) || settings?.enabled_modules?.includes(moduleName) || false;
  };

  return {
    user,
    profile,
    company,
    role,
    settings,
    isLoading: isLoading || isContextLoading,
    companyId: profile?.company_id || (profile as any)?.companyId,
    isSuperAdmin: isSuperAdminValue,
    hasPermission,
    isModuleEnabled,
  };
}
