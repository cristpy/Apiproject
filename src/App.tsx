// client/src/App.tsx
import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import LandingPage from './component/LandingPage';
import UploadPage from './component/UploadPage';
import ResultPage from './component/ResultPage';
import './styles/LandingPage.scss';
import './styles/LoadingSpinner.scss';
import './styles/ResultPage.scss';
import './styles/UploadPage.scss';
import './styles/global.scss';

const App: React.FC = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
            >
              <LandingPage />
            </motion.div>
          }
        />
        <Route
          path="/upload"
          element={
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
            >
              <UploadPage />
            </motion.div>
          }
        />
        <Route
          path="/result"
          element={
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
            >
              <ResultPage />
            </motion.div>
          }
        />
      </Routes>
    </AnimatePresence>
  );
};

export default App;
