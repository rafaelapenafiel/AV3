import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import "./css/App.css"
import { AuthProvider, useAuth } from './AuthContext';
import Login from './Login';
import DashboardLayout from './Dashboard';
import Employees from './Funcionarios';
import { Aircrafts } from './Aircrafts';
import NotImplemented from './NotImplemented';
import Pecas from './Pecas';
import Etapas from './Etapas';
import Testes from './Testes';
import Relatorios from './Relatorios';
import type { JSX } from 'react';

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="aeronaves" replace />} />
        <Route path="aeronaves" element={<Aircrafts />} />
        <Route path="pecas" element={<Pecas />} />
        <Route path="etapas" element={<Etapas />} />
        <Route path="testes" element={<Testes />} />
        <Route path="relatorios" element={<Relatorios />} />
        <Route path="funcionarios" element={<Employees />} />
        <Route path="*" element={<NotImplemented />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App
