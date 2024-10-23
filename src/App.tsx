// client/src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './component/LandingPage';
import UploadPage from './component/UploadPage';
import ResultPage from './component/ResultPage';
import './styles/LandingPage.scss';
import './styles/LoadingSpinner.scss';
import './styles/ResultPage.scss';
import './styles/UploadPage.scss';
const App: React.FC = () => (
  <Router>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/upload" element={<UploadPage />} />
      <Route path="/result" element={<ResultPage />} />
    </Routes>
  </Router>
);

export default App;

