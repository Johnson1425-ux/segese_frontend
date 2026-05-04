import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from 'react-query';
import { HelmetProvider } from 'react-helmet-async';
import { ErrorBoundary } from 'react-error-boundary';
import { Menu, Sun, Moon } from 'lucide-react';

// Context Providers
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
// import { ThemeProvider, useTheme } from './context/ThemeContext.jsx';

// Components
import Sidebar from './components/Sidebar.jsx';
import LoadingSpinner from './components/common/LoadingSpinner.jsx';
import ErrorFallback from './components/common/ErrorFallback.jsx';
import UnauthorizedPage from './components/common/UnauthorizedPage.jsx';

// Auth Components
import LoginForm from './components/auth/LoginForm.jsx';
import ForgotPasswordForm from './components/auth/ForgotPasswordForm.jsx';
import ResetPasswordForm from './components/auth/ResetPasswordForm.jsx';
import VerifyEmail from './components/auth/VerifyEmail.jsx';

// Pages
import Home from './pages/Home.jsx';
import AboutUs from './pages/AboutUs.jsx';
import ServicesPage from './pages/ServicesPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Patients from './pages/Patients.jsx';
import PatientSearch from './pages/PatientSearch.jsx';
import PatientForm from './pages/PatientForm.jsx';
import Doctors from './pages/Doctors.jsx';
import DoctorSchedule from './pages/DoctorSchedule.jsx';
import DoctorQueue from './pages/DoctorQueue.jsx';
import Appointments from './pages/Appointments.jsx';
import AppointmentForm from './pages/AppointmentForm.jsx';
import Visits from './pages/Visits.jsx';
import VisitForm from './pages/VisitForm.jsx';
import VisitDetail from './pages/VisitDetail.jsx';
import ActiveVisits from './pages/ActiveVisits.jsx';
import IPD from './pages/IPD.jsx';
import IPDRecordsManagement from './pages/IPDRecordsManagement.jsx';
import WardManagement from './pages/WardManagement.jsx';
import BedManagement from './pages/BedManagement.jsx';
import Users from './pages/Users.jsx';
import UserForm from './pages/UserForm.jsx';
import Profile from './components/profile/Profile.jsx';
import Settings from './components/settings/Settings.jsx';
import NotFound from './components/common/NotFound.jsx';
import BillingDashboard from './pages/BillingDashboard.jsx';
import Services from './pages/Services.jsx';
import RadiologyDashboard from './pages/RadiologyDashboard.jsx';
import Theatre from './pages/Theatre.jsx';
import ServiceForm from './pages/ServiceForm.jsx';
import Invoices from './pages/Invoices.jsx';
import InvoiceDetail from './pages/InvoiceDetail.jsx';
import InvoiceForm from './pages/InvoiceForm.jsx';
import Dispensing from './pages/Dispensing.jsx';
import LabTests from './pages/LabTests.jsx';
import LabTestDetail from './pages/LabTestDetail.jsx';
import CompletedLabTests from './pages/CompletedLabTests.jsx';
import DirectDispensing from './pages/DirectDispensing.jsx';
import Requisition from './pages/Requisition.jsx';
import StockTaking from './pages/StockTaking.jsx';
import StoreBalance from './pages/StoreBalance.jsx';
import ItemPricing from './pages/ItemPricing.jsx';
import ItemReceiving from './pages/ItemReceiving.jsx';
import IncomingItems from './pages/IncomingItems.jsx';
import MortuaryDashboard from './pages/MortuaryDashboard.jsx';
import CorpseRegistration from './pages/CorpseRegistration.jsx';
import CorpseDetail from './pages/CorpseDetail.jsx';
import CabinetManagement from './pages/CabinetManagement.jsx';
import ReleaseManagement from './pages/ReleaseManagement.jsx';
import TheatreRoomsManagement from './pages/TheatreRoomsManagement.jsx';
import TheatreProceduresManagement from './pages/TheatreProceduresManagement.jsx';
import Reports from './pages/Reports.jsx';
import NurseInjectionsPage from './pages/NurseInjectionsPage.jsx';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children, requiredPermissions = [], requiredRoles = [] }) => {
  const { isAuthenticated, isLoading, hasAnyPermission, hasAnyRole } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermissions.length > 0 && !hasAnyPermission(requiredPermissions)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Theme Toggle Button
// const ThemeToggle = ({ className = '' }) => {
//   const { isDark, toggleTheme } = useTheme();
//   return (
//     <button
//       onClick={toggleTheme}
//       aria-label="Toggle dark mode"
//       className={`p-2 rounded-lg transition-colors duration-200 ${
//         isDark
//           ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400'
//           : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
//       } ${className}`}
//     >
//       {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
//     </button>
//   );
// };

// Layout Component
const AppLayout = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const publicRoutes = [
    '/',
    '/home',
    '/about',
    '/our-services',
    '/login',
    '/forgot-password',
    '/register'
  ];

  const isPublicRoute = publicRoutes.includes(location.pathname) ||
    location.pathname.startsWith('/reset-password') ||
    location.pathname.startsWith('/verify-email');

  if (!isAuthenticated || isPublicRoute) {
    return children;
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
      <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between shadow-sm z-30">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Segese Medical</h1>
          <ThemeToggle />
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900">
          <div className="p-4 sm:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

// Main App Component
const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <AppLayout>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/our-services" element={<ServicesPage />} />

          {/* Auth Routes */}
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginForm />
          } />
          <Route path="/forgot-password" element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <ForgotPasswordForm />
          } />
          <Route path="/reset-password/:token" element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <ResetPasswordForm />
          } />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute requiredRoles={['admin']}><Reports /></ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute requiredRoles={['admin']}><Users /></ProtectedRoute>
          } />
          <Route path="/users/new" element={
            <ProtectedRoute requiredRoles={['admin']}><UserForm /></ProtectedRoute>
          } />
          <Route path="/users/edit/:id" element={
            <ProtectedRoute requiredRoles={['admin']}><UserForm /></ProtectedRoute>
          } />

          {/* Patient Routes */}
          <Route path="/patients" element={
            <ProtectedRoute requiredRoles={['admin', 'doctor', 'nurse', 'receptionist']}><Patients /></ProtectedRoute>
          } />
          <Route path="/patients/search" element={
            <ProtectedRoute requiredRoles={['admin', 'doctor', 'nurse', 'receptionist']}><PatientSearch /></ProtectedRoute>
          } />
          <Route path="/patients/new" element={
            <ProtectedRoute requiredRoles={['admin', 'receptionist']}><PatientForm /></ProtectedRoute>
          } />
          <Route path="/patients/edit/:id" element={
            <ProtectedRoute requiredRoles={['admin', 'receptionist']}><PatientForm /></ProtectedRoute>
          } />

          {/* Doctor Routes */}
          <Route path="/doctors" element={
            <ProtectedRoute requiredRoles={['admin']}><Doctors /></ProtectedRoute>
          } />
          <Route path="/doctors/schedule" element={
            <ProtectedRoute requiredRoles={['admin', 'doctor', 'receptionist']}><DoctorSchedule /></ProtectedRoute>
          } />
          <Route path="/doctor-queue" element={
            <ProtectedRoute requiredRoles={['admin', 'doctor', 'nurse']}><DoctorQueue /></ProtectedRoute>
          } />

          {/* Appointment Routes */}
          <Route path="/appointments" element={
            <ProtectedRoute requiredRoles={['admin', 'doctor', 'receptionist']}><Appointments /></ProtectedRoute>
          } />
          <Route path="/appointments/new" element={
            <ProtectedRoute requiredRoles={['admin', 'receptionist']}><AppointmentForm /></ProtectedRoute>
          } />
          <Route path="/appointments/edit/:id" element={
            <ProtectedRoute requiredRoles={['admin', 'receptionist']}><AppointmentForm /></ProtectedRoute>
          } />

          {/* Visit Routes */}
          <Route path="/visits" element={
            <ProtectedRoute requiredRoles={['admin', 'doctor', 'nurse', 'receptionist']}><Visits /></ProtectedRoute>
          } />
          <Route path="/visits/new" element={
            <ProtectedRoute requiredRoles={['admin', 'receptionist']}><VisitForm /></ProtectedRoute>
          } />
          <Route path="/visits/active" element={
            <ProtectedRoute requiredRoles={['admin', 'doctor', 'nurse']}><ActiveVisits /></ProtectedRoute>
          } />
          <Route path="/visits/:id" element={
            <ProtectedRoute requiredRoles={['admin', 'doctor', 'nurse']}><VisitDetail /></ProtectedRoute>
          } />

          {/* IPD Routes */}
          <Route path="/ipd" element={
            <ProtectedRoute requiredRoles={['admin', 'doctor', 'nurse']}><IPD /></ProtectedRoute>
          } />
          <Route path="/ipd-records" element={
            <ProtectedRoute requiredRoles={['admin', 'doctor', 'nurse']}><IPDRecordsManagement /></ProtectedRoute>
          } />
          <Route path="/wards" element={
            <ProtectedRoute requiredRoles={['admin']}><WardManagement /></ProtectedRoute>
          } />
          <Route path="/beds" element={
            <ProtectedRoute requiredRoles={['admin', 'nurse']}><BedManagement /></ProtectedRoute>
          } />

          {/* Billing Routes */}
          <Route path="/billing" element={
            <ProtectedRoute requiredRoles={['admin', 'receptionist']}><BillingDashboard /></ProtectedRoute>
          } />
          <Route path="/billing/invoices" element={
            <ProtectedRoute requiredRoles={['admin', 'receptionist']}><Invoices /></ProtectedRoute>
          } />
          <Route path="/billing/invoices/new" element={
            <ProtectedRoute requiredRoles={['admin', 'receptionist']}><InvoiceForm /></ProtectedRoute>
          } />
          <Route path="/billing/invoices/:id" element={
            <ProtectedRoute requiredRoles={['admin', 'receptionist']}><InvoiceDetail /></ProtectedRoute>
          } />

          {/* Services Routes */}
          <Route path="/services" element={
            <ProtectedRoute requiredRoles={['admin']}><Services /></ProtectedRoute>
          } />
          <Route path="/services/new" element={
            <ProtectedRoute requiredRoles={['admin']}><ServiceForm /></ProtectedRoute>
          } />
          <Route path="/services/edit/:id" element={
            <ProtectedRoute requiredRoles={['admin']}><ServiceForm /></ProtectedRoute>
          } />

          {/* Lab Test Routes */}
          <Route path="/lab-tests" element={
            <ProtectedRoute requiredRoles={['admin', 'lab_technician']}><LabTests /></ProtectedRoute>
          } />
          <Route path="/lab-tests/:id" element={
            <ProtectedRoute requiredRoles={['admin', 'lab_technician', 'doctor']}><LabTestDetail /></ProtectedRoute>
          } />
          <Route path="/lab-tests/completed" element={
            <ProtectedRoute requiredRoles={['admin', 'doctor']}><CompletedLabTests /></ProtectedRoute>
          } />

          {/* Radiology Routes */}
          <Route path="/radiology" element={
            <ProtectedRoute requiredRoles={['admin', 'radiologist']}><RadiologyDashboard /></ProtectedRoute>
          } />

          <Route path="/nurse/injections" element={
            <ProtectedRoute requiredRoles={['nurse', 'doctor', 'admin']}><NurseInjectionsPage /></ProtectedRoute>
          } />


          {/* Theatre Routes */}
          <Route path="/theatre-scheduling" element={
            <ProtectedRoute requiredRoles={['admin', 'doctor']}><Theatre /></ProtectedRoute>
          } />
          <Route path="/theatres" element={
            <ProtectedRoute requiredRoles={['admin']}><TheatreRoomsManagement /></ProtectedRoute>
          } />
          <Route path="/theatre-procedures" element={
            <ProtectedRoute requiredRoles={['admin', 'surgeon']}><TheatreProceduresManagement /></ProtectedRoute>
          } />

          {/* Pharmacy Routes */}
          <Route path="/dispensing" element={
            <ProtectedRoute requiredRoles={['admin', 'pharmacist']}><Dispensing /></ProtectedRoute>
          } />
          <Route path="/direct-dispensing" element={
            <ProtectedRoute requiredRoles={['admin', 'pharmacist']}><DirectDispensing /></ProtectedRoute>
          } />
          <Route path="/requisition" element={
            <ProtectedRoute requiredRoles={['admin', 'pharmacist']}><Requisition /></ProtectedRoute>
          } />
          <Route path="/store-balance" element={
            <ProtectedRoute requiredRoles={['admin', 'pharmacist']}><StoreBalance /></ProtectedRoute>
          } />
          <Route path="/stock-taking" element={
            <ProtectedRoute requiredRoles={['admin', 'pharmacist']}><StockTaking /></ProtectedRoute>
          } />
          <Route path="/item-pricing" element={
            <ProtectedRoute requiredRoles={['admin', 'pharmacist']}><ItemPricing /></ProtectedRoute>
          } />
          <Route path="/item-receiving" element={
            <ProtectedRoute requiredRoles={['admin', 'pharmacist']}><ItemReceiving /></ProtectedRoute>
          } />
          <Route path="/incoming-items" element={
            <ProtectedRoute requiredRoles={['admin', 'pharmacist']}><IncomingItems /></ProtectedRoute>
          } />

          {/* Mortuary Routes */}
          <Route path="/corpses" element={
            <ProtectedRoute requiredRoles={['admin', 'mortuary_attendant']}><MortuaryDashboard /></ProtectedRoute>
          } />
          <Route path="/corpses/new" element={
            <ProtectedRoute requiredRoles={['admin', 'mortuary_attendant']}><CorpseRegistration /></ProtectedRoute>
          } />
          <Route path="/corpses/:id" element={
            <ProtectedRoute requiredRoles={['admin', 'mortuary_attendant']}><CorpseDetail /></ProtectedRoute>
          } />
          <Route path="/cabinets" element={
            <ProtectedRoute requiredRoles={['admin', 'mortuary_attendant']}><CabinetManagement /></ProtectedRoute>
          } />
          <Route path="/releases" element={
            <ProtectedRoute requiredRoles={['admin', 'mortuary_attendant']}><ReleaseManagement /></ProtectedRoute>
          } />

          {/* Profile & Settings */}
          <Route path="/profile" element={
            <ProtectedRoute><Profile /></ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute><Settings /></ProtectedRoute>
          } />

          {/* Error Routes */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppLayout>
    </Router>
  );
};

// Main App Component with Providers
const App = () => {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          {/* <ThemeProvider> */}
            <AuthProvider>
              <AppContent />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    duration: 3000,
                    iconTheme: { primary: '#10B981', secondary: '#fff' },
                  },
                  error: {
                    duration: 3000,
                    iconTheme: { primary: '#EF4444', secondary: '#fff' },
                  },
                }}
              />
            </AuthProvider>
          {/* </ThemeProvider> */}
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
};

export default App;