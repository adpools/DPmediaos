'use client';

import { useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, Firestore } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

/**
 * Hook to get the current user's company and role context.
 * Standardized on snake_case fields (company_id, role_id).
 */
export function useTenant() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const db = useFirestore();

  // 1. Get the User Profile from Firestore to find their company_id and role_id
  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  // 2. Get the Company data
  const companyRef = useMemoFirebase(() => {
    if (!db || !profile?.company_id) return null;
    return doc(db, 'companies', profile.company_id);
  }, [db, profile?.company_id]);

  const { data: company, isLoading: isCompanyLoading } = useDoc(companyRef);

  // 3. Get the Role permissions
  const roleRef = useMemoFirebase(() => {
    if (!db || !profile?.company_id || !profile?.role_id) return null;
    return doc(db, 'companies', profile.company_id, 'roles', profile.role_id);
  }, [db, profile?.company_id, profile?.role_id]);

  const { data: role, isLoading: isRoleLoading } = useDoc(roleRef);

  // 4. Get Company Settings (for enabled modules)
  const settingsRef = useMemoFirebase(() => {
    if (!db || !profile?.company_id) return null;
    return doc(db, 'companies', profile.company_id, 'company_settings', profile.company_id);
  }, [db, profile?.company_id]);

  const { data: settings, isLoading: isSettingsLoading } = useDoc(settingsRef);

  const isLoading = isAuthLoading || isProfileLoading || isCompanyLoading || isRoleLoading || isSettingsLoading;

  const hasPermission = (module: string, action: 'view' | 'create' | 'edit' | 'delete' | 'approve' = 'view') => {
    if (!role?.permissions) return false;
    const perms = role.permissions[module];
    return perms ? perms[action] : false;
  };

  const isModuleEnabled = (moduleName: string) => {
    return settings?.enabled_modules?.includes(moduleName) ?? false;
  };

  return {
    user,
    profile,
    company,
    role,
    settings,
    isLoading,
    companyId: profile?.company_id,
    hasPermission,
    isModuleEnabled,
  };
}