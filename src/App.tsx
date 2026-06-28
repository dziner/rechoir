import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Library } from './pages/Library';
import { SongDetail } from './pages/SongDetail';
import { RecordPerformance } from './pages/RecordPerformance';
import { Settings } from './pages/Settings';

export function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/library" element={<Library />} />
        <Route path="/song/:id" element={<SongDetail />} />
        <Route path="/record" element={<RecordPerformance />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}
