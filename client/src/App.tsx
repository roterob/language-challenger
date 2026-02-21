import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { ProtectedRoute } from '@/components/protected-route';
import { LoginPage } from '@/pages/login';
import { ResourcesPage } from '@/pages/resources';
import { ListsPage } from '@/pages/lists';
import { ExecutionsPage } from '@/pages/executions';
import { ImportsPage } from '@/pages/imports';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/resources" replace />} />
        <Route path="resources" element={<ResourcesPage />} />
        <Route path="lists" element={<ListsPage />} />
        <Route path="executions" element={<ExecutionsPage />} />
        <Route path="imports" element={<ImportsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
