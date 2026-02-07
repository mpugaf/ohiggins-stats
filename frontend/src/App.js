// frontend/src/App.js - O'Higgins Stats v2.0 - Sistema de Autenticación y Apuestas
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Context
import { AuthProvider } from './context/AuthContext';

// Common Components
import AppHeader from './components/common/AppHeader';

// Authentication Components
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';

// Betting System Components (User)
import PartidosApuestasManager from './components/apuestas/PartidosApuestasManager';

// Consultation Components (Both Admin and User)
import RosterJugadores from './components/consultas/RosterJugadores';

// Admin Components
import Dashboard from './components/Dashboard';
import HomePage from './components/HomePage';
import GestionCuotas from './components/admin/GestionCuotas';
import LiquidarApuestas from './components/admin/LiquidarApuestas';
import LimpiarApuestasUsuario from './components/admin/LimpiarApuestasUsuario';
import ConfiguracionApuestas from './components/admin/ConfiguracionApuestas';

// Original Management Components (Admin Only)
import NuevoEstadio from './components/NuevoEstadio';
import ListaEstadios from './components/ListaEstadios';
import EditarEstadio from './components/EditarEstadio';
import NuevoEquipo from './components/NuevoEquipo';
import ListaEquipos from './components/ListaEquipos';
import EditarEquipo from './components/EditarEquipo';
import PlayersManager from './components/PlayersManager';
import AsignacionJugador from './components/AsignacionJugador';
import AsignacionMasiva from './components/asignaciones/AsignacionMasiva';
import ListadoJugadores from './components/ListadoJugadores';
import ListaTorneos from './components/ListaTorneos';
import NuevoTorneo from './components/NuevoTorneo';
import EditarTorneo from './components/EditarTorneo';
import PartidosManager from './components/PartidosManager';

// User Management Components (Admin Only)
import ListaUsuarios from './components/usuarios/ListaUsuarios';
import NuevoUsuario from './components/usuarios/NuevoUsuario';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppHeader />
          <Routes>
            {/* ==================== PUBLIC ROUTES ==================== */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* ==================== USER ROUTES (AUTHENTICATED) ==================== */}
            {/* Main Betting Interface */}
            <Route
              path="/partidos-apuestas"
              element={
                <ProtectedRoute>
                  <PartidosApuestasManager />
                </ProtectedRoute>
              }
            />

            {/* ==================== CONSULTATION ROUTES (ALL AUTHENTICATED USERS) ==================== */}
            {/* Roster de Jugadores por Equipo - Accesible para todos los usuarios autenticados */}
            <Route
              path="/consultas/roster-jugadores"
              element={
                <ProtectedRoute>
                  <RosterJugadores />
                </ProtectedRoute>
              }
            />

            {/* ==================== ADMIN ROUTES ==================== */}
            {/* Admin Dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Betting Management (Admin) */}
            <Route
              path="/gestion-cuotas"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <GestionCuotas />
                </ProtectedRoute>
              }
            />

            <Route
              path="/liquidar-apuestas"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <LiquidarApuestas />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/limpiar-apuestas-usuario"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <LimpiarApuestasUsuario />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/configuracion-apuestas"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <ConfiguracionApuestas />
                </ProtectedRoute>
              }
            />

            {/* Stadiums Management (Admin) */}
            <Route
              path="/nuevo-estadio"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <NuevoEstadio />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lista-estadios"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <ListaEstadios />
                </ProtectedRoute>
              }
            />
            <Route
              path="/editar-estadio/:id"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <EditarEstadio />
                </ProtectedRoute>
              }
            />

            {/* Teams Management (Admin) */}
            <Route
              path="/nuevo-equipo"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <NuevoEquipo />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lista-equipos"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <ListaEquipos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/editar-equipo/:id"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <EditarEquipo />
                </ProtectedRoute>
              }
            />

            {/* Players Management (Admin) */}
            <Route
              path="/jugadores"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <PlayersManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="/asignacion-jugador"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AsignacionJugador />
                </ProtectedRoute>
              }
            />
            <Route
              path="/asignacion-masiva"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AsignacionMasiva />
                </ProtectedRoute>
              }
            />
            <Route
              path="/listado-jugadores"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <ListadoJugadores />
                </ProtectedRoute>
              }
            />

            {/* Tournaments Management (Admin) */}
            <Route
              path="/torneos"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <ListaTorneos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/nuevo-torneo"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <NuevoTorneo />
                </ProtectedRoute>
              }
            />
            <Route
              path="/editar-torneo/:id"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <EditarTorneo />
                </ProtectedRoute>
              }
            />

            {/* Matches Management (Admin) */}
            <Route
              path="/partidos"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <PartidosManager />
                </ProtectedRoute>
              }
            />

            {/* Users Management (Admin) */}
            <Route
              path="/admin/usuarios"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <ListaUsuarios />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/usuarios/nuevo"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <NuevoUsuario />
                </ProtectedRoute>
              }
            />

            {/* HomePage - Protected for backward compatibility */}
            <Route
              path="/home"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <HomePage />
                </ProtectedRoute>
              }
            />

            {/* ==================== DEFAULT REDIRECT ==================== */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* 404 - Not Found */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;