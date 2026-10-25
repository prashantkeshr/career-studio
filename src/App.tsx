import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { Dashboard } from './features/dashboard/Dashboard';
import { CareerProfilePage } from './features/career-profile/CareerProfile';
import { ResumeStudio } from './features/resume-studio/ResumeStudio';
import { useStore } from './state/store';

export function App() {
  const { ready } = useStore();
  return (
    <AppShell>
      {!ready ? (
        <div className="content" style={{ paddingTop: 60, textAlign: 'center' }}>
          <p className="muted">Loading your workspace…</p>
        </div>
      ) : (
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/profile" element={<CareerProfilePage />} />
          <Route path="/resume/:id" element={<ResumeStudio />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </AppShell>
  );
}
