import { createContext, useContext, useReducer, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-hot-toast';
import api from '../utils/api.js';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: true,
  permissions: [],
  role: null,
  preferences: {
    theme: localStorage.getItem('theme') || 'light',
    language: 'en',
    notifications: {
      email: true,
      sms: false,
      push: true
    }
  }
};

const getPermissionsByRole = (role) => {
  const rolePermissions = {
    admin: ['admin:all'],
    doctor: ['view_patients', 'view_appointments', 'edit_patients', 'create_visits', 'prescribe_medications', 'order_lab_tests'],
    nurse: ['view_patients', 'edit_vitals', 'view_visits'],
    receptionist: ['view_patients', 'view_appointments', 'create_appointments', 'edit_appointments', 'view:visits'],
    pharmacist: ['view_prescriptions', 'dispense_medications',],
    lab_technician: ['view_lab_tests', 'update_lab_results'],
    radiologist: ['view_radiology_tests', 'update_radiology_results'],
    mortuary_attendant: ['view_corpses', 'update_corpses'],
    user: [] // Regular users have no special permissions
  };
  
  return rolePermissions[role] || [];
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true
      };
    
    case 'AUTH_SUCCESS': {
      const user = action.payload.user;
      const userRole = user?.role || null;
      const userPermissions = userRole ? getPermissionsByRole(userRole) : [];
      
      return {
        ...state,
        user: user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        permissions: userPermissions,
        role: userRole,
        preferences: user?.preferences || state.preferences
      };
    }

    case 'AUTH_FAIL':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        permissions: [],
        role: null
      };
    
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        permissions: [],
        role: null
      };
    
    case 'UPDATE_USER': {
      const updatedUser = { ...state.user, ...action.payload };
      const updatedRole = updatedUser.role;
      const updatedPermissions = updatedRole ? getPermissionsByRole(updatedRole) : state.permissions;
      
      return {
        ...state,
        user: updatedUser,
        permissions: updatedPermissions,
        role: updatedRole,
        preferences: updatedUser.preferences || state.preferences
      };
    }

    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        preferences: { ...state.preferences, ...action.payload },
        user: state.user ? {
          ...state.user,
          preferences: { ...state.preferences, ...action.payload }
        } : state.user
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
    
    case 'TOGGLE_THEME': {
      const newTheme = state.preferences.theme === 'light' ? 'dark' : 'light';
      // Update localStorage
      localStorage.setItem('theme', newTheme);
      
      return {
        ...state,
        preferences: {
          ...state.preferences,
          theme: newTheme
        }
      };
    }

    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if token is valid on app start
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        dispatch({ type: 'AUTH_FAIL' });
        return;
      }

      try {
        // Check if token is expired
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        
        if (decoded.exp < currentTime) {
          localStorage.removeItem('token');
          dispatch({ type: 'AUTH_FAIL' });
          return;
        }

        // Set the token in axios defaults
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        const response = await api.get('/users/profile');
        
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user: response.data.data,
            token
          }
        });
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        dispatch({ type: 'AUTH_FAIL' });
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (email, password) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await api.post('/auth/login', { email, password });
      const { user, token } = response.data.data;
      
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token }
      });
      
      toast.success(`Welcome back, ${user.firstName}!`);
      return { success: true };
    } catch (error) {
      dispatch({ type: 'AUTH_FAIL' });
      
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Register function (Admin only)
  const register = async (userData) => {
    try {
      const response = await api.post('/users', userData);
      
      toast.success('Staff member registered successfully!');
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('theme');
      delete api.defaults.headers.common['Authorization'];
      dispatch({ type: 'LOGOUT' });
      toast.success('Logged out successfully');
    }
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      const response = await api.put('/users/profile', userData);
      const updatedUser = response.data.data;
      
      dispatch({
        type: 'UPDATE_USER',
        payload: updatedUser
      });
      
      toast.success('Profile updated successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Update preferences
  const updatePreferences = async (preferences) => {
    try {
      const response = await api.put('/users/preferences', preferences);
      const updatedPreferences = response.data.data.preferences;
      
      dispatch({
        type: 'UPDATE_PREFERENCES',
        payload: updatedPreferences
      });
      
      // Update theme in localStorage if it's being changed
      if (preferences.theme) {
        localStorage.setItem('theme', preferences.theme);
      }
      
      toast.success('Preferences updated successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Preferences update failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Change password
  const changePassword = async (currentPassword, newPassword, confirmPassword = newPassword) => {
    try {
      await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword
      });
      
      toast.success('Password changed successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Forgot password
  const forgotPassword = async (email) => {
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('Password reset email sent successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Password reset failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Reset password
  const resetPassword = async (token, newPassword) => {
  try {
    await api.put(`/auth/reset-password/${token}`, {
      password: newPassword
    });

    toast.success('Password reset successfully');
    return { success: true };
  } catch (error) {
    const message = error.response?.data?.message || 'Password reset failed';
    toast.error(message);
    throw error; // re-throw so ResetPasswordForm can catch it
  }
};

  // Verify email
  const verifyEmail = async (token) => {
    try {
      await api.get(`/auth/verify-email/${token}`);
      toast.success('Email verified successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Email verification failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Resend verification email
  // Takes the address explicitly: this runs before sign-in, so there is no
  // authenticated user to infer it from. The previous version sent no body,
  // which the endpoint rejects.
  const resendVerification = async (email) => {
    try {
      const response = await api.post('/auth/resend-verification', { email });
      toast.success(response.data?.data || 'Verification email sent');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send verification email';
      toast.error(message);
      return { success: false, message };
    }
  };

  const toggleTheme = () => {
    dispatch({ type: 'TOGGLE_THEME' });
  };

  // Check if user has permission
  const hasPermission = (permission) => {
    return state.permissions.includes('admin:all') || state.permissions.includes(permission);
  };

  // Check if user has any of the given permissions
  const hasAnyPermission = (permissions) => {
    if (state.permissions.includes('admin:all')) {
      return true;
    }
    return permissions.some(permission => state.permissions.includes(permission));
  };

  const hasAllPermissions = (permissions) => {
    // Admin has all permissions
    if (state.permissions.includes('admin:all')) {
      return true;
    }
    return permissions.every(permission => state.permissions.includes(permission));
  };

  // Check if user has role
  const hasRole = (role) => {
    return state.role === role;
  };

  // Check if user has any of the given roles
  const hasAnyRole = (roles) => {
    return roles.includes(state.role);
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    updatePreferences,
    changePassword,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification,
    toggleTheme,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Exporting the hook alongside the provider is the conventional shape for a
// context module. This rule only affects Fast Refresh in development, and
// splitting the hook into its own file would touch every consumer for no
// runtime benefit.
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;