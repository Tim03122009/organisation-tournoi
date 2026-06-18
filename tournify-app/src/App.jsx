import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { TournamentProvider } from "./context/TournamentContext";
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

export default function App() {
  return (
    <TournamentProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/general" replace />} />
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
      </BrowserRouter>
    </TournamentProvider>
  );
}
