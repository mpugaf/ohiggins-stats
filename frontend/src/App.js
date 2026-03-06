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
import ListaInvitaciones from './components/ListaInvitaciones';
import ProtectedRoute from './components/ProtectedRoute';

// Betting System Components (User)
import PartidosApuestasManager from './components/apuestas/PartidosApuestasManager';

// Consultation Components (Both Admin and User)
import RosterJugadores from './components/consultas/RosterJugadores';
import PartidosHistoricosPlus from './components/apuestas/PartidosHistoricosPlus';

// Admin Components
import Dashboard from './components/Dashboard';
import HomePage from './components/HomePage';
import LimpiarApuestasUsuario from './components/admin/LimpiarApuestasUsuario';
import LimpiarResultados from './components/admin/LimpiarResultados';
import ConfiguracionApuestas from './components/admin/ConfiguracionApuestas';
import GestionTokens from './components/admin/GestionTokens';
import AsignacionTokensUsuarios from './components/admin/AsignacionTokensUsuarios';
import GestionProgramas from './components/admin/GestionProgramas';
import RankingAdmin from './components/admin/RankingAdmin';

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
import ClonarAsignaciones from './components/ClonarAsignaciones';
import ListadoJugadores from './components/ListadoJugadores';
import ListaTorneos from './components/ListaTorneos';
import NuevoTorneo from './components/NuevoTorneo';
import EditarTorneo from './components/EditarTorneo';
import PartidosManager from './components/PartidosManager';
import PartidosManagerPlus from './components/PartidosManagerPlus';

// User Management Components (Admin Only)
import ListaUsuarios from './components/usuarios/ListaUsuarios';
import NuevoUsuario from './components/usuarios/NuevoUsuario';
import EditarUsuario from './components/usuarios/EditarUsuario';

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
            <Route path="/invitaciones" element={<ListaInvitaciones />} />

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

            {/* Partidos Históricos - Accesible para todos los usuarios autenticados */}
            <Route
              path="/consultas/partidos-historicos-plus"
              element={
                <ProtectedRoute>
                  <PartidosHistoricosPlus />
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
              path="/admin/limpiar-apuestas-usuario"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <LimpiarApuestasUsuario />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/limpiar-resultados"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <LimpiarResultados />
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

            {/* Gestión de Tokens de Invitación (Admin) */}
            <Route
              path="/admin/tokens-invitacion"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <GestionTokens />
                </ProtectedRoute>
              }
            />

            {/* Asignación de Tokens a Usuarios (Admin) */}
            <Route
              path="/admin/asignacion-tokens"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AsignacionTokensUsuarios />
                </ProtectedRoute>
              }
            />

            {/* Gestión de Programas/Podcasts (Admin) */}
            <Route
              path="/admin/gestion-programas"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <GestionProgramas />
                </ProtectedRoute>
              }
            />

            {/* Ranking completo (Admin) */}
            <Route
              path="/admin/ranking"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <RankingAdmin />
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
              path="/clonar-asignaciones"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <ClonarAsignaciones />
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

            {/* Matches Management Plus (Admin) */}
            <Route
              path="/partidos-plus"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <PartidosManagerPlus />
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
            <Route
              path="/admin/usuarios/editar/:id"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <EditarUsuario />
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