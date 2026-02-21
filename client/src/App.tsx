import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AppLayout } from '@/components/layout';
import { ProtectedRoute } from '@/components/protected-route';
import { LoginPage } from '@/pages/login';

const ResourcesPage = lazy(() =>
  import('@/pages/resources').then((m) => ({ default: m.ResourcesPage })),
);
const ListsPage = lazy(() => import('@/pages/lists').then((m) => ({ default: m.ListsPage })));
const ExecutionsPage = lazy(() =>
  import('@/pages/executions').then((m) => ({ default: m.ExecutionsPage })),
);
const ImportsPage = lazy(() => import('@/pages/imports').then((m) => ({ default: m.ImportsPage })));

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

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
        <Route
          path="resources"
          element={
            <Suspense fallback={<PageLoader />}>
              <ResourcesPage />
            </Suspense>
          }
        />
        <Route
          path="lists"
          element={
            <Suspense fallback={<PageLoader />}>
              <ListsPage />
            </Suspense>
          }
        />
        <Route
          path="executions"
          element={
            <Suspense fallback={<PageLoader />}>
              <ExecutionsPage />
            </Suspense>
          }
        />
        <Route
          path="imports"
          element={
            <Suspense fallback={<PageLoader />}>
              <ImportsPage />
            </Suspense>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
