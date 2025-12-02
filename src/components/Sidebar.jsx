import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  UserCheck, 
  Calendar, 
  Activity,
  Plus,
  Settings,
  Search,
  User,
  LogOut,
  Shield,
  FileText,
  BarChart3,
  Bell,
  DollarSign, 
  Briefcase,
  AlignEndHorizontal,
  ChevronDown,
  ChevronRight,
  PlusCircle,
  UserPlus,
  Truck,
  Microscope,
  Store,
  ToggleLeft,
  CheckCircle,
  Menu,
  X,
  Scissors,
  Building2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const Sidebar = () => {
  const location = useLocation();
  const { user, logout, hasPermission, hasRole } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({
    main: true,
    patients: false,
    pharmacy: false,
    lab: false,
    radiology: false,
    theatre: false,
    administration: false
  });

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const getMenuGroups = () => {
    const groups = [];

    // Main Dashboard - always visible
    groups.push({
      name: 'main',
      label: 'Dashboard',
      items: [
        { path: '/dashboard', icon: Home, label: 'Dashboard', roles: ['admin', 'doctor', 'pharmacist', 'receptionist', 'lab_technician'] }
      ]
    });

    // Patient Management Group
    if (hasRole('admin') || hasRole('doctor') || hasRole('mortuary_attendant') || hasRole('receptionist') || hasRole('nurse')) {
      const patientItems = [
        { path: '/patients/new', icon: UserPlus, label: 'Patient Registration', roles: ['admin', 'receptionist'] },
        { path: '/patients', icon: Users, label: 'Patients', roles: ['admin', 'receptionist'] },
        { path: '/patients/search', icon: Search, label: 'Advanced Search', roles: ['admin', 'receptionist'] },
        { path: '/appointments', icon: Calendar, label: 'Appointments', roles: ['admin', 'doctor', 'nurse', 'receptionist'] },
        { path: '/visits/end-visit', icon: ToggleLeft, label: 'End Visit', roles: ['admin', 'receptionist'] },
        { path: '/lab-tests/completed', icon: CheckCircle, label: 'Lab Results', roles: ['admin', 'doctor'] },
        { path: '/admission', icon: Activity, label: 'Admission', roles: ['admin', 'doctor', 'nurse'] },
        { path: '/ipd', icon: Activity, label: 'IPD', roles: ['admin', 'doctor', 'nurse'] },
        { path: '/wards', icon: Activity, label: 'Wards', roles: ['admin', 'nurse'] },
        { path: '/beds', icon: Activity, label: 'Beds', roles: ['admin', 'nurse'] }
      ];

      if (hasRole('doctor')) {
        patientItems.push({ path: '/doctors/my-queue', icon: Activity, label: 'My Queue', roles: ['doctor'] });
      } else {
        patientItems.push({ path: '/visits', icon: Activity, label: 'Visits', roles: ['admin', 'receptionist'] });
      }

      groups.push({
        name: 'patients',
        label: 'Patient Management',
        items: patientItems.filter(item => item.roles.some(role => hasRole(role)))
      });
    }

    // Billing Group
    if (hasRole('receptionist') || hasRole('admin')) {
      groups.push({
        name: 'billing',
        label: 'Billing',
        items: [
          { path: '/billing', icon: DollarSign, label: 'Cashier Services', roles: ['admin', 'receptionist'] },
        ]
      });
    }

    // Pharmacy Group
    if (hasRole('admin') || hasRole('receptionist') || hasRole('pharmacist')) {
      const pharmacyItems = [
        { path: '/dispensing', icon: Briefcase, label: 'Dispensing', roles: ['admin', 'pharmacist'] },
        { path: '/direct-dispensing', icon: Briefcase, label: 'Direct Dispensing', roles: ['admin', 'pharmacist'] },
        { path: '/requisition', icon: FileText, label: 'Requisitions', roles: ['admin', 'pharmacist'] },
        { path: '/store-balance', icon: BarChart3, label: 'Store Balance', roles: ['admin', 'pharmacist'] },
        { path: '/stock-taking', icon: Store, label: 'Stock Taking', roles: ['admin', 'pharmacist'] },
        { path: '/item-pricing', icon: DollarSign, label: 'Item Pricing', roles: ['admin'] },
        { path: '/item-receiving', icon: Briefcase, label: 'Item Receiving', roles: ['admin', 'pharmacist'] },
        { path: '/incoming-items', icon: AlignEndHorizontal, label: 'Incoming Items', roles: ['admin', 'pharmacist'] }
      ];

      const filteredPharmacyItems = pharmacyItems.filter(item => item.roles.some(role => hasRole(role)));
      if (filteredPharmacyItems.length > 0) {
        groups.push({
          name: 'pharmacy',
          label: 'Pharmacy',
          items: filteredPharmacyItems
        });
      }
    }

    // Laboratory Group
    if (hasRole('lab_technician') || hasRole('admin')) {
      groups.push({
        name: 'lab',
        label: 'Laboratory',
        items: [
          { path: '/lab-tests', icon: Activity, label: 'Lab Orders', roles: ['admin', 'lab_technician'] }
        ]
      });
    }

    // Radiology Group
    if (hasRole('radiologist') || hasRole('admin')) {
      groups.push({
        name: 'radiology',
        label: 'Radiology',
        items: [
          { path: '/radiology', icon: Microscope, label: 'Radiology', roles: ['admin', 'radiologist'] }
        ]
      });
    }

    // Theatre Group
    if (hasRole('surgeon') || hasRole('doctor') || hasRole('admin')) {
      groups.push({
        name: 'theatre',
        label: 'Theatre',
        items: [
          { path: '/theatre-scheduling', icon: Scissors, label: 'Theatre Scheduling', roles: ['admin', 'doctor'] },
          { path: '/theatre-procedures', icon: Scissors, label: 'Pending Procedures', roles: ['admin', 'surgeon'] },
          { path: '/theatres', icon: Building2, label: 'Theatre Rooms', roles: ['admin'] }
        ]
      });
    }

    // Mortuary Group
    if (hasRole('admin') || hasRole('mortuary_attendant')) {
      groups.push({
        name: 'mortuary',
        label: 'Mortuary',
        items: [
          { path: '/corpses/new', icon: Users, label: 'Corpse Registration', roles: ['admin', 'mortuary_attendant'] },
          { path: '/corpses', icon: Users, label: 'Corpse Management', roles: ['admin', 'mortuary_attendant'] },
          { path: '/cabinets', icon: Users, label: 'Cabinet Management', roles: ['admin', 'mortuary_attendant'] },
          { path: '/releases', icon: Users, label: 'Release Management', roles: ['admin', 'mortuary_attendant'] }
        ]
      });
    }

    // Administration Group
    if (hasRole('admin')) {
      groups.push({
        name: 'administration',
        label: 'Administration',
        items: [
          { path: '/doctors', icon: UserCheck, label: 'Doctors', roles: ['admin'] },
          { path: '/reports', icon: BarChart3, label: 'Reports', roles: ['admin'] },
          { path: '/services', icon: Briefcase, label: 'Services', roles: ['admin'] },
          { path: '/users', icon: Shield, label: 'User Management', roles: ['admin'] }
        ]
      });
    }

    return groups.filter(group => group.items.length > 0);
  };

  const menuGroups = getMenuGroups();

  const getRoleDisplayName = (role) => {
    const roleNames = {
      admin: 'Administrator',
      doctor: 'Doctor',
      pharmacist: 'Pharmacist',
      receptionist: 'Receptionist',
      lab_technician: 'Lab Technician',
      mortuary_attendant: 'Mortuaty Attendant',
      surgeon: 'Surgeon'
    };
    return roleNames[role] || role;
  };

  return (
    <div className={`bg-white shadow-lg flex flex-col h-full transition-all duration-300 ${
      isCollapsed ? 'w-20' : 'w-64'
    }`}>
      {/* Toggle Button */}
      <div className="p-2 border-b border-gray-200 flex items-center justify-between">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <Menu className="w-5 h-5 text-gray-600" /> : <Menu className="w-5 h-5 text-gray-600" />}
        </button>
      </div>
      
      {/* User Info */}
      <div className="p-4 border-b border-gray-200">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt="Profile"
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <User className="h-5 w-5 text-blue-600" />
            )}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {getRoleDisplayName(user?.role)}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto">
        <div className={`${isCollapsed ? 'px-2' : 'px-4'} py-4`}>
          {!isCollapsed && (
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Navigation
            </h3>
          )}
          <div className="space-y-2">
            {menuGroups.map((group) => (
              <div key={group.name} className="space-y-1">
                {/* Group Header */}
                {group.name !== 'main' && !isCollapsed ? (
                  <button
                    onClick={() => toggleGroup(group.name)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <span>{group.label}</span>
                    {expandedGroups[group.name] ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                ) : null}
                
                {/* Group Items */}
                <div className={`space-y-1 ${
                  group.name !== 'main' && !expandedGroups[group.name] && !isCollapsed ? 'hidden' : ''
                }`}>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-3'} py-2 text-sm font-medium rounded-md transition-colors ${
                          group.name !== 'main' && !isCollapsed ? 'ml-4' : ''
                        } ${
                          isActive
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                        }`}
                        title={isCollapsed ? item.label : ''}
                      >
                        <Icon className={`w-4 h-4 ${!isCollapsed ? 'mr-3' : ''}`} />
                        {!isCollapsed && item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className={`${isCollapsed ? 'p-2' : 'p-4'} border-t border-gray-200`}>
        <div className="space-y-1">
          <Link
            to="/profile"
            className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-3'} py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 transition-colors`}
            title={isCollapsed ? 'Profile' : ''}
          >
            <User className={`w-4 h-4 ${!isCollapsed ? 'mr-3' : ''}`} />
            {!isCollapsed && 'Profile'}
          </Link>
          <Link
            to="/settings"
            className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-3'} py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 transition-colors`}
            title={isCollapsed ? 'Change Password' : ''}
          >
            <Settings className={`w-4 h-4 ${!isCollapsed ? 'mr-3' : ''}`} />
            {!isCollapsed && 'Change Password'}
          </Link>
          <button
            onClick={logout}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-3'} py-2 text-sm font-medium text-red-600 rounded-md hover:bg-gray-50 hover:text-red-700 transition-colors`}
            title={isCollapsed ? 'Logout' : ''}
          >
            <LogOut className={`w-4 h-4 ${!isCollapsed ? 'mr-3' : ''} text-red-600`} />
            {!isCollapsed && 'Logout'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
