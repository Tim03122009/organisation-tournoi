import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { TournamentProvider } from "./context/TournamentContext";
import { AppUIProvider } from "./context/AppUIContext";
import AppModal from "./components/AppModal";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import Toast from "./components/Toast";
import LoginPage from "./pages/LoginPage";
import TournoisPage from "./pages/TournoisPage";
import GeneralPage, { ParticipantsLayout } from "./pages/GeneralPage";
import TeamsPage from "./pages/TeamsPage";
import RefereesPage from "./pages/RefereesPage";
import AdminsPage from "./pages/AdminsPage";
import StructurePage from "./pages/StructurePage";
import CalendarPage from "./pages/CalendarPage";
import ScoresPage from "./pages/ScoresPage";
import {
  PresentationLayout,
  PresentationWebsitePage,
  PresentationSlideshowPage,
  PresentationDesignPage,
  PresentationPageEdit,
} from "./pages/PresentationPage";
import TeamPortalPage from "./pages/TeamPortalPage";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/tournois" replace />} />
      <Route path="/tournois" element={<TournoisPage />} />
      <Route path="/general" element={<GeneralPage />} />
      <Route path="/participants" element={<ParticipantsLayout />}>
        <Route index element={<Navigate to="teams" replace />} />
        <Route path="teams" element={<TeamsPage />} />
        <Route path="referees" element={<RefereesPage />} />
        <Route path="admins" element={<AdminsPage />} />
      </Route>
      <Route path="/structure" element={<StructurePage />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/presentation" element={<PresentationLayout />}>
        <Route index element={<PresentationWebsitePage />} />
        <Route path="slideshow" element={<PresentationSlideshowPage />} />
        <Route path="design" element={<PresentationDesignPage />} />
        <Route path="page/:pageId" element={<PresentationPageEdit />} />
      </Route>
      <Route path="/scores" element={<ScoresPage />} />
    </Routes>
  );
}

export default function App() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || undefined;

  return (
    <AppUIProvider>
      <ErrorBoundary>
        <AuthProvider>
          <BrowserRouter basename={basename}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/equipe/:token" element={<TeamPortalPage />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <TournamentProvider>
                      <AppRoutes />
                      <AppModal />
                      <Toast />
                    </TournamentProvider>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ErrorBoundary>
    </AppUIProvider>
  );
}
