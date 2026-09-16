import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChange } from '../services/authService';

const ADMIN_USERNAME = 'HPAIRAdmin@gmail.com';
const ADMIN_PASSWORD = 'HPAIRR0cks123!';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginAdmin = ({ username, password }) => {
    const normalizedUsername = username.trim().toLowerCase();

    if (normalizedUsername === ADMIN_USERNAME.toLowerCase() && password === ADMIN_PASSWORD) {
      const adminSession = {
        username: ADMIN_USERNAME,
        role: 'admin',
        email: ADMIN_USERNAME
      };

      setAdminUser(adminSession);
      return { success: true, message: 'Admin login successful!' };
    }

    setAdminUser(null);
    return { success: false, message: 'Invalid admin credentials.' };
  };

  const logoutAdmin = () => {
    setAdminUser(null);
  };

  const value = {
    user,
    adminUser,
    loading,
    isAuthenticated: !!user,
    isAdminAuthenticated: !!adminUser,
    userId: user?.uid || null,
    loginAdmin,
    logoutAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
