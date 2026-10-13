// ==============================================================================
// RENTAL PS MANAGEMENT SYSTEM - MAIN ROUTER & APP ROOT
// Default route: /rental for Cashier, /dashboard for Owner. OwnerRouteGuard enabled.
// ==============================================================================

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { OfflineSyncProvider } from '@/context/OfflineSyncContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { RentalProvider } from '@/context/RentalContext';

// Layout & Security Components
import { MainLayout } from '@/components/layout/MainLayout';
import { OwnerPinModal } from '@/components/auth/OwnerPinModal';
import { OwnerRouteGuard } from '@/components/auth/OwnerRouteGuard';
import { PwaInstallPrompt } from '@/components/pwa/PwaInstallPrompt';

// Pages
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { RentalPage } from '@/pages/RentalPage';
import { LogbookPage } from '@/pages/LogbookPage';
import { CashBookPage } from '@/pages/CashBookPage';
import { ExpensePage } from '@/pages/ExpensePage';
import { ReportsPage } from '@/pages/ReportsPage';
import { InventoryPage } from '@/pages/InventoryPage';
import { ExcelPage } from '@/pages/ExcelPage';
import { TariffSettingsPage } from '@/pages/TariffSettingsPage';
import { AppSettingsPage } from '@/pages/AppSettingsPage';
import { UsersPage } from '@/pages/UsersPage';
import { AuditLogPage } from '@/pages/AuditLogPage';

// Protected Route Wrapper for logged in users
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Root index redirect: Cashier goes to /rental, Owner goes to /dashboard
const RootIndexRedirect: React.FC = () => {
  const { isOwner } = useAuth();
  return <Navigate to={isOwner ? "/dashboard" : "/rental"} replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <OfflineSyncProvider>
            <AuthProvider>
              <RentalProvider>
                <OwnerPinModal />
                <PwaInstallPrompt />
                <Routes>
                  {/* Public Route */}
                  <Route path="/login" element={<LoginPage />} />

                  {/* Private Protected Routes wrapped in MainLayout */}
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <MainLayout />
                      </ProtectedRoute>
                    }
                  >
                    {/* Index Route */}
                    <Route index element={<RootIndexRedirect />} />

                    {/* Operational Cashier Route (Open to Cashier & Owner) */}
                    <Route path="rental" element={<RentalPage />} />

                    {/* Owner-Protected Routes */}
                    <Route
                      path="dashboard"
                      element={
                        <OwnerRouteGuard>
                          <DashboardPage />
                        </OwnerRouteGuard>
                      }
                    />
                    <Route
                      path="logbook"
                      element={
                        <OwnerRouteGuard>
                          <LogbookPage />
                        </OwnerRouteGuard>
                      }
                    />
                    <Route
                      path="keuangan/kas"
                      element={
                        <OwnerRouteGuard>
                          <CashBookPage />
                        </OwnerRouteGuard>
                      }
                    />
                    <Route
                      path="keuangan/pengeluaran"
                      element={
                        <OwnerRouteGuard>
                          <ExpensePage />
                        </OwnerRouteGuard>
                      }
                    />
                    <Route
                      path="laporan"
                      element={
                        <OwnerRouteGuard>
                          <ReportsPage />
                        </OwnerRouteGuard>
                      }
                    />
                    <Route
                      path="inventaris"
                      element={
                        <OwnerRouteGuard>
                          <InventoryPage />
                        </OwnerRouteGuard>
                      }
                    />
                    <Route
                      path="excel"
                      element={
                        <OwnerRouteGuard>
                          <ExcelPage />
                        </OwnerRouteGuard>
                      }
                    />
                    <Route
                      path="pengaturan/tarif"
                      element={
                        <OwnerRouteGuard>
                          <TariffSettingsPage />
                        </OwnerRouteGuard>
                      }
                    />
                    <Route
                      path="pengaturan/aplikasi"
                      element={
                        <OwnerRouteGuard>
                          <AppSettingsPage />
                        </OwnerRouteGuard>
                      }
                    />
                    <Route
                      path="pengguna"
                      element={
                        <OwnerRouteGuard>
                          <UsersPage />
                        </OwnerRouteGuard>
                      }
                    />
                    <Route
                      path="audit-log"
                      element={
                        <OwnerRouteGuard>
                          <AuditLogPage />
                        </OwnerRouteGuard>
                      }
                    />
                  </Route>

                  {/* Fallback */}
                  <Route path="*" element={<RootIndexRedirect />} />
                </Routes>
              </RentalProvider>
            </AuthProvider>
          </OfflineSyncProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
