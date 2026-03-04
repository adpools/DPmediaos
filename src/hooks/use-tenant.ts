
'use client';

import { useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, Firestore } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

/**
 * Hook to get the current user's company and role context.
 */
export function useTenant() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const db = useFirestore();

  // 1. Get the User Profile from Firestore to find their companyId and roleId
  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  // 2. Get the Company data
  const companyRef = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return doc(db, 'companies', profile.companyId);
  }, [db, profile?.companyId]);

  const { data: company, isLoading: isCompanyLoading } = useDoc(companyRef);

  // 3. Get the Role permissions
  const roleRef = useMemoFirebase(() => {
    if (!db || !profile?.companyId || !profile?.roleId) return null;
    return doc(db, 'companies', profile.companyId, 'roles', profile.roleId);
  }, [db, profile?.companyId, profile?.roleId]);

  const { data: role, isLoading: isRoleLoading } = useDoc(roleRef);

  // 4. Get Company Settings (for enabled modules)
  const settingsRef = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return doc(db, 'companies', profile.companyId, 'company_settings', profile.companyId);
  }, [db, profile?.companyId]);

  const { data: settings, isLoading: isSettingsLoading } = useDoc(settingsRef);

  const isLoading = isAuthLoading || isProfileLoading || isCompanyLoading || isRoleLoading || isSettingsLoading;

  const hasPermission = (module: string, action: 'view' | 'create' | 'edit' | 'delete' | 'approve' = 'view') => {
    if (!role?.permissions) return false;
    const perms = role.permissions[module];
    return perms ? perms[action] : false;
  };

  const isModuleEnabled = (moduleName: string) => {
    return settings?.enabledModules?.includes(moduleName) ?? false;
  };

  return {
    user,
    profile,
    company,
    role,
    settings,
    isLoading,
    companyId: profile?.companyId,
    hasPermission,
    isModuleEnabled,
  };
}
