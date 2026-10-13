// ==============================================================================
// RENTAL PS MANAGEMENT SYSTEM - MAIN ROUTER & APP ROOT
// ThemeProvider (Dark/Light) & OfflineSyncProvider Integration
// ==============================================================================

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { OfflineSyncProvider } from '@/context/OfflineSyncContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { RentalProvider } from '@/context/RentalContext';

// Layout
import { MainLayout } from '@/components/layout/MainLayout';

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

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <OfflineSyncProvider>
            <AuthProvider>
              <RentalProvider>
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
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="rental" element={<RentalPage />} />
                    <Route path="logbook" element={<LogbookPage />} />
                    <Route path="keuangan/kas" element={<CashBookPage />} />
                    <Route path="keuangan/pengeluaran" element={<ExpensePage />} />
                    <Route path="laporan" element={<ReportsPage />} />
                    <Route path="inventaris" element={<InventoryPage />} />
                    <Route path="excel" element={<ExcelPage />} />
                    <Route path="pengaturan/tarif" element={<TariffSettingsPage />} />
                    <Route path="pengaturan/aplikasi" element={<AppSettingsPage />} />
                    <Route path="pengguna" element={<UsersPage />} />
                    <Route path="audit-log" element={<AuditLogPage />} />
                  </Route>

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </RentalProvider>
            </AuthProvider>
          </OfflineSyncProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
