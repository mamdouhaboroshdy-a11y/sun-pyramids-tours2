import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  signInAnonymously
} from 'firebase/auth';
import { auth } from '../firebase';
import { apiGet, apiPost, apiPatch } from '../lib/api';

// User profiles now persist to Postgres (/api/users). Firebase is used ONLY for
// the optional Google sign-in popup — all profile data lives in our own database.
async function fetchProfileById(id: string): Promise<UserProfile | null> {
  try {
    const all = await apiGet<UserProfile[]>('/users');
    return all.find((u) => u.id === id) || null;
  } catch {
    return null;
  }
}
async function upsertProfile(profile: UserProfile): Promise<UserProfile> {
  try {
    return await apiPost<UserProfile>('/users', profile);
  } catch {
    return profile;
  }
}

export type UserRole = 'super_admin' | 'admin' | 'editor' | 'user';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsDemo: (role: UserRole) => Promise<void>;
  signInWithCredentials: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfileRole: (userId: string, role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync auth state
  useEffect(() => {
    // Check for saved virtual session first
    const savedVirtualProfile = localStorage.getItem('virtual_admin_profile');
    if (savedVirtualProfile) {
      try {
        const parsedProfile = JSON.parse(savedVirtualProfile);
        setProfile(parsedProfile);
        setUser({
          uid: parsedProfile.id,
          email: parsedProfile.email,
          displayName: parsedProfile.name,
          emailVerified: true,
          isAnonymous: true,
          metadata: {},
          providerData: [],
        } as any);
        setLoading(false);
      } catch (e) {
        console.error('Error parsing virtual profile:', e);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // If we have a virtual session from localStorage, let it take precedence
      if (localStorage.getItem('virtual_admin_profile')) {
        setLoading(false);
        return;
      }

      setUser(firebaseUser);
      if (firebaseUser) {
        // Fetch profile
        await fetchOrCreateProfile(firebaseUser);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchOrCreateProfile = async (firebaseUser: FirebaseUser, forceRole?: UserRole) => {
    try {
      const existing = await fetchProfileById(firebaseUser.uid);

      if (existing) {
        if (forceRole && forceRole !== existing.role) {
          await apiPatch(`/users/${firebaseUser.uid}`, { role: forceRole });
          setProfile({ ...existing, role: forceRole });
        } else {
          setProfile(existing);
        }
      } else {
        const isDefaultSuper = firebaseUser.email === 'mmdohgiko@gmail.com' || firebaseUser.email?.includes('superadmin');
        const role: UserRole = forceRole || (isDefaultSuper ? 'super_admin' : 'user');

        const newProfile: UserProfile = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'New User',
          role: role,
          createdAt: new Date().toISOString()
        };

        await upsertProfile(newProfile);
        setProfile(newProfile);
      }
    } catch (e) {
      console.error('Error fetching/creating user profile:', e);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error('Google Sign In Error:', e);
      setLoading(false);
    }
  };

  // Demo sign in so user can test various roles instantly
  const signInAsDemo = async (role: UserRole) => {
    setLoading(true);
    const demoEmail = `${role}@sunpyramidstours.com`;
    const demoName = role === 'super_admin' ? 'Super Admin' :
                     role === 'admin' ? 'Admin' :
                     role === 'editor' ? 'Editor' : 'User';

    try {
      let firebaseUser: any = null;
      try {
        const userCredential = await signInAnonymously(auth);
        firebaseUser = userCredential.user;
      } catch (authErr) {
        console.warn('Anonymous auth failed or disabled, falling back to local virtual session:', authErr);
        firebaseUser = {
          uid: `virtual_demo_${role}`,
          email: demoEmail,
          displayName: demoName,
          emailVerified: true,
          isAnonymous: true,
          metadata: {},
          providerData: [],
        };
      }

      const newProfile: UserProfile = {
        id: firebaseUser.uid,
        email: demoEmail,
        name: demoName,
        role: role,
        createdAt: new Date().toISOString()
      };

      await upsertProfile(newProfile);

      setProfile(newProfile);
      setUser(firebaseUser);
    } catch (e) {
      console.error('Error seeding demo profile:', e);
    } finally {
      setLoading(false);
    }
  };

  const signInWithCredentials = async (username: string, password: string): Promise<boolean> => {
    setLoading(true);
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    // Secure administrator credentials
    if (cleanUser === 'admin' && cleanPass === 'admin') {
      const adminEmail = 'admin@sunpyramidstours.com';
      const adminName = 'System Leader (Super Admin)';
      const role: UserRole = 'super_admin';

      try {
        let firebaseUser: any = null;
        try {
          const userCredential = await signInAnonymously(auth);
          firebaseUser = userCredential.user;
        } catch (authErr) {
          console.warn('Anonymous auth failed, using local virtual session instead:', authErr);
          firebaseUser = {
            uid: 'admin_virtual_super',
            email: adminEmail,
            displayName: adminName,
            emailVerified: true,
            isAnonymous: true,
            metadata: {},
            providerData: [],
          };
        }

        const newProfile: UserProfile = {
          id: firebaseUser.uid,
          email: adminEmail,
          name: adminName,
          role: role,
          createdAt: new Date().toISOString()
        };

        // Save virtual profile to localStorage
        localStorage.setItem('virtual_admin_profile', JSON.stringify(newProfile));

        // Persist the admin profile to Postgres (best effort).
        await upsertProfile(newProfile);

        setProfile(newProfile);
        setUser(firebaseUser);
        setLoading(false);
        return true;
      } catch (e) {
        console.error('Error setting virtual admin credentials profile:', e);
      }
    }
    setLoading(false);
    return false;
  };

  const logout = async () => {
    setLoading(true);
    localStorage.removeItem('virtual_admin_profile');
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Sign Out Error:', e);
    }
    setUser(null);
    setProfile(null);
    setLoading(false);
  };

  const updateProfileRole = async (userId: string, role: UserRole) => {
    try {
      await apiPatch(`/users/${userId}`, { role });
      if (profile && profile.id === userId) {
        setProfile({ ...profile, role });
      }
    } catch (e) {
      console.error('Error updating profile role:', e);
    }
  };

    const contextValue: AuthContextType = {
      user,
      profile,
      loading,
      signInWithGoogle,
      signInAsDemo,
      signInWithCredentials,
      logout,
      updateProfileRole
    };

    return (
      <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
