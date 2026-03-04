
'use client';

import { useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

/**
 * Hook to get the current user's company and role context.
 * Standardized on snake_case fields (company_id, role_id).
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

  // 5. Get Super Admin Marker
  const superAdminRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'super_admins', user.uid);
  }, [db, user?.uid]);

  const { data: superAdmin, isLoading: isSuperAdminLoading } = useDoc(superAdminRef);

  const isLoading = isAuthLoading || isProfileLoading || isCompanyLoading || isRoleLoading || isSettingsLoading || isSuperAdminLoading;

  /**
   * Checks if the user has a specific permission for a module.
   */
  const hasPermission = (module: string, action: 'view' | 'create' | 'edit' | 'delete' | 'approve' = 'view') => {
    // Super admins and Workspace Admins have all permissions for enabled modules
    if (!!superAdmin || profile?.role_id === 'admin') return true;
    
    if (!role?.permissions) return false;
    const perms = role.permissions[module];
    return perms ? perms[action] : false;
  };

  /**
   * Checks if a module is enabled globally for the company.
   */
  const isModuleEnabled = (moduleName: string) => {
    // Super admins see all modules regardless of workspace settings
    if (!!superAdmin) return true;
    // If settings document doesn't exist yet, default to core modules
    if (!settings) return ['dashboard', 'projects'].includes(moduleName);
    return settings?.enabledModules?.includes(moduleName) || settings?.enabled_modules?.includes(moduleName) || false;
  };

  return {
    user,
    profile,
    company,
    role,
    settings,
    isLoading,
    companyId: profile?.company_id,
    isSuperAdmin: !!superAdmin,
    hasPermission,
    isModuleEnabled,
  };
}
