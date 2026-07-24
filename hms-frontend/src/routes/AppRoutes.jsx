import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import PagePermissionRoute from './PagePermissionRoute';  
import Login from '../pages/auth/Login';
import ForgotPassword from '../pages/auth/ForgotPassword';
import Dashboard from '../pages/dashboard/Dashboard';
import SettingsPage from '../pages/settings/SettingsPage';
import NotFound from '../pages/NotFound';
import ResetPassword from '../pages/auth/ResetPassword';

// OPD
import { OpdProvider } from '../context/OpdContext';
import PatientRegistrationPage from '../pages/opd/PatientRegistrationPage';
import AppointmentManagementPage from '../pages/opd/AppointmentManagementPage';
import DoctorConsultationPage from '../pages/opd/DoctorConsultationPage';
import PrescriptionPage from '../pages/opd/PrescriptionPage';
import BillingInvoicePage from '../pages/opd/BillingInvoicePage';
import PatientHistoryPage from '../pages/opd/PatientHistoryPage';

// IPD
import { IpdProvider } from '../context/IpdContext';
import AdmissionFormPage from '../pages/ipd/AdmissionFormPage';
import WardManagementPage from '../pages/ipd/WardManagementPage';
import BedAllocationPage from '../pages/ipd/BedAllocationPage';
import TreatmentRecordsPage from '../pages/ipd/TreatmentRecordsPage';
import DischargeSummaryPage from '../pages/ipd/DischargeSummaryPage';
import IpdBillingPage from '../pages/ipd/IpdBillingPage';

// Pharmacy
import { PharmacyProvider } from '../context/PharmacyContext';
import MedicineInventoryPage from '../pages/pharmacy/MedicineInventoryPage';
import PurchaseEntryPage from '../pages/pharmacy/PurchaseEntryPage';
import SalesBillingPage from '../pages/pharmacy/SalesBillingPage';
import StockManagementPage from '../pages/pharmacy/StockManagementPage';
import ExpiryAlertsPage from '../pages/pharmacy/ExpiryAlertsPage';
import PharmacyReportsPage from '../pages/pharmacy/PharmacyReportsPage';

// User Management
import { UserManagementProvider } from '../context/UserManagementContext';
import UserListPage from '../pages/user-management/UserListPage';
import RoleManagementPage from '../pages/user-management/RoleManagementPage';
import PermissionsManagementPage from '../pages/user-management/PermissionsManagementPage';

// Reports & Analytics
import AnalyticsDashboardPage from '../pages/reports-analytics/AnalyticsDashboardPage';
import OpdReportsPage from '../pages/reports-analytics/OpdReportsPage';
import IpdReportsPage from '../pages/reports-analytics/IpdReportsPage';
import PharmacyReportsAnalyticsPage from '../pages/reports-analytics/PharmacyReportsAnalyticsPage';
import RevenueReportsPage from '../pages/reports-analytics/RevenueReportsPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
        <Route element={<PagePermissionRoute />}>
          <Route path="/" element={<Dashboard />} />

          {/* OPD module — shares one OpdProvider across all its sub-pages */}
          <Route element={<RoleRoute module="opd" />}>
            <Route path="/opd" element={<OpdProvider><Outlet /></OpdProvider>}>
              <Route index element={<Navigate to="patients" replace />} />
              <Route path="patients" element={<PatientRegistrationPage />} />
              <Route path="appointments" element={<AppointmentManagementPage />} />
              <Route path="consultation" element={<DoctorConsultationPage />} />
              <Route path="prescriptions" element={<PrescriptionPage />} />
              <Route path="billing" element={<BillingInvoicePage />} />
              <Route path="history" element={<PatientHistoryPage />} />
            </Route>
          </Route>

          {/* IPD module (Ward Management): Admin, Doctor, Nurse, Receptionist */}
          <Route element={<RoleRoute module="ipd" />}>
            <Route path="/ipd" element={<IpdProvider><Outlet /></IpdProvider>}>
              <Route index element={<Navigate to="admission" replace />} />
              <Route path="admission" element={<AdmissionFormPage />} />
              <Route path="wards" element={<WardManagementPage />} />
              <Route path="beds" element={<BedAllocationPage />} />
              <Route path="treatments" element={<TreatmentRecordsPage />} />
              <Route path="discharge" element={<DischargeSummaryPage />} />
              <Route path="billing" element={<IpdBillingPage />} />
            </Route>
          </Route>

          {/* Pharmacy module: Admin, Pharmacist ONLY */}
          <Route element={<RoleRoute module="pharmacy" />}>
            <Route path="/pharmacy" element={<PharmacyProvider><Outlet /></PharmacyProvider>}>
              <Route index element={<Navigate to="inventory" replace />} />
              <Route path="inventory" element={<MedicineInventoryPage />} />
              <Route path="purchase" element={<PurchaseEntryPage />} />
              <Route path="sales" element={<SalesBillingPage />} />
              <Route path="stock" element={<StockManagementPage />} />
              <Route path="expiry" element={<ExpiryAlertsPage />} />
              <Route path="reports" element={<PharmacyReportsPage />} />
            </Route>
          </Route>

          {/* User Management module: Admin only */}
          <Route element={<RoleRoute module="users" />}>
            <Route path="/users" element={<UserManagementProvider><Outlet /></UserManagementProvider>}>
              <Route index element={<Navigate to="list" replace />} />
              <Route path="list" element={<UserListPage />} />
              <Route path="roles" element={<RoleManagementPage />} />
              <Route path="permissions" element={<PermissionsManagementPage />} />
            </Route>
          </Route>

          {/* Reports & Analytics module: Admin, Doctor, Nurse, Receptionist */}
          <Route element={<RoleRoute module="reports" />}>
            <Route path="/reports" element={<Outlet />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AnalyticsDashboardPage />} />
              <Route path="opd" element={<OpdReportsPage />} />
              <Route path="ipd" element={<IpdReportsPage />} />
              <Route path="pharmacy" element={<PharmacyReportsAnalyticsPage />} />
              <Route path="revenue" element={<RevenueReportsPage />} />
            </Route>
          </Route>

        {/* Settings: Admin only — wrapped with UserManagementProvider so the Users & Roles tab shows real DB data */}
          <Route element={<RoleRoute module="settings" />}>
            <Route path="/settings" element={<UserManagementProvider><SettingsPage /></UserManagementProvider>} />
          </Route>
        </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}