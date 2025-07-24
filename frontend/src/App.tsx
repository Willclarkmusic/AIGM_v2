import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './components/auth/AuthPage';
import MainLayout from './components/layout/MainLayout';

// Import devTools for development (exposes window.devTools)
import './utils/devTools';

const AppContent: React.FC = () => {
  const { user, loading, profile } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
          <p className="text-gray-600 dark:text-gray-400">Restoring session...</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Check console for detailed logs
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  // Show profile loading if user exists but profile is still loading
  if (user && !profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            User: {user.email}
          </p>
        </div>
      </div>
    );
  }

  return <MainLayout />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;