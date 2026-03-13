import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Shield, AlertCircle } from 'lucide-react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: string;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * AuthGuard Component - Protects routes from unauthorized access
 * 
 * Features:
 * - Verifies Supabase Auth session
 * - Optional role-based access control
 * - Loading state during authentication check
 * - Customizable fallback UI
 * 
 * @example
 * <AuthGuard requiredRole="admin">
 *   <AdminDashboard />
 * </AuthGuard>
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requiredRole,
  fallback,
  redirectTo = '/login'
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        setIsAuthenticated(true);

        // If role checking is required, fetch user metadata
        if (requiredRole) {
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError || !user) {
            setIsAuthenticated(false);
            setLoading(false);
            return;
          }

          // Check role from user metadata (app_metadata is set by admin)
          const role = user.app_metadata?.role || user.user_metadata?.role || 'user';
          setUserRole(role);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setUserRole(null);
      } else if (event === 'SIGNED_IN' && session) {
        setIsAuthenticated(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [requiredRole]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }

    // Default unauthorized UI
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-600 mb-6">
            You must be logged in to access this page.
          </p>
          <a
            href={redirectTo}
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  // Role check failed
  if (requiredRole && userRole !== requiredRole) {
    if (fallback) {
      return <>{fallback}</>;
    }

    // Default insufficient permissions UI
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <Shield className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Insufficient Permissions</h2>
          <p className="text-slate-600 mb-2">
            This page requires <strong>{requiredRole}</strong> role.
          </p>
          <p className="text-sm text-slate-500 mb-6">
            Your current role: <strong>{userRole || 'user'}</strong>
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Go to Home
          </a>
        </div>
      </div>
    );
  }

  // Authentication and authorization successful
  return <>{children}</>;
};