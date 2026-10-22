import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './config';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isLoggedIn: boolean;
  isAdmin: boolean;
  isDemoUser: boolean;
  loginWithGoogle: () => Promise<void>;
  loginDemo: () => void;
  logout: () => Promise<void>;
  agreeTermsAndPrivacy: () => Promise<void>;
  updateProfileName: (name: string) => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER_PROFILE: UserProfile = {
  uid: 'demo-user-munglife',
  email: 'demo@munglife.kr',
  displayName: '멍이보호자 (체험계정)',
  photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  termsAgreed: true,
  termsAgreedAt: new Date().toISOString(),
  privacyAgreed: true,
  role: 'user',
  createdAt: new Date().toISOString(),
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoUser, setIsDemoUser] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Check if demo user saved in localStorage
    const savedDemo = localStorage.getItem('munglife_demo_user');
    if (savedDemo === 'true') {
      setIsDemoUser(true);
      setUserProfile(DEMO_USER_PROFILE);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsDemoUser(false);
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            setUserProfile(snap.data() as UserProfile);
          } else {
            // New user registration in Firestore
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || '멍라이프 보호자',
              photoURL: currentUser.photoURL || '',
              termsAgreed: true,
              termsAgreedAt: new Date().toISOString(),
              privacyAgreed: true,
              role: currentUser.email === 'midfield36@gmail.com' ? 'admin' : 'user',
              createdAt: new Date().toISOString(),
            };
            try {
              await setDoc(userDocRef, newProfile);
            } catch (err) {
              console.warn('Could not write user profile to Firestore, caching locally:', err);
            }
            setUserProfile(newProfile);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // Fallback profile
          setUserProfile({
            uid: currentUser.uid,
            email: currentUser.email || '',
            displayName: currentUser.displayName || '멍라이프 보호자',
            photoURL: currentUser.photoURL || '',
            termsAgreed: true,
            privacyAgreed: true,
            role: currentUser.email === 'midfield36@gmail.com' ? 'admin' : 'user',
            createdAt: new Date().toISOString(),
          });
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      setAuthError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      if (err.code === 'auth/popup-blocked') {
        setAuthError('브라우저 팝업이 차단되었습니다. 팝업 허용 후 다시 시도해 주세요.');
      } else if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
        setAuthError('로그인 창이 닫혔습니다.');
      } else {
        setAuthError(`로그인 중 오류가 발생했습니다: ${err.message || '다시 시도해주세요'}`);
      }
      throw err;
    }
  };

  const loginDemo = () => {
    setIsDemoUser(true);
    setUserProfile(DEMO_USER_PROFILE);
    localStorage.setItem('munglife_demo_user', 'true');
  };

  const logout = async () => {
    if (isDemoUser) {
      setIsDemoUser(false);
      setUserProfile(null);
      localStorage.removeItem('munglife_demo_user');
      return;
    }
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (err: any) {
      console.error('Sign-out error:', err);
    }
  };

  const agreeTermsAndPrivacy = async () => {
    if (!userProfile) return;
    const updated = {
      ...userProfile,
      termsAgreed: true,
      termsAgreedAt: new Date().toISOString(),
      privacyAgreed: true,
    };
    setUserProfile(updated);
    if (!isDemoUser && user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          termsAgreed: true,
          termsAgreedAt: updated.termsAgreedAt,
          privacyAgreed: true,
        });
      } catch (err) {
        console.warn('Failed to update terms in Firestore:', err);
      }
    }
  };

  const updateProfileName = async (name: string) => {
    if (!name.trim()) return;
    if (userProfile) {
      const updated = { ...userProfile, displayName: name.trim() };
      setUserProfile(updated);
      if (!isDemoUser && user) {
        try {
          await updateDoc(doc(db, 'users', user.uid), { displayName: name.trim() });
        } catch (err) {
          console.warn('Failed to update name in Firestore:', err);
        }
      }
    }
  };

  const isLoggedIn = !!user || isDemoUser;
  const isAdmin = userProfile?.email === 'midfield36@gmail.com' || userProfile?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        isLoggedIn,
        isAdmin,
        isDemoUser,
        loginWithGoogle,
        loginDemo,
        logout,
        agreeTermsAndPrivacy,
        updateProfileName,
        authError,
        clearAuthError: () => setAuthError(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
