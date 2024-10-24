// client/src/components/LandingPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import '../styles/LandingPage.scss';

const pageVariants = {
  initial: { opacity: 0, y: 50 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -50 },
};

const buttonVariants = {
  hover: { scale: 1.1 },
  tap: { scale: 0.9 },
};

const LandingPage: React.FC = () => {
  const navigate = useNavigate(); 

  const navigateToUpload = () => {
    navigate('/upload'); 
  };

  return (
    <motion.div
      className="landing-page"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.5 }}
    >
      <header className="landing-header">
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          Audio to Text Converter
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          Convert your audio files to text in just a few clicks
        </motion.p>
      </header>
      <motion.button
        onClick={navigateToUpload}
        className="upload-button"
        variants={buttonVariants}
        whileHover="hover"
        whileTap="tap"
      >
        Upload File Now
      </motion.button>
    </motion.div>
  );
};

export default LandingPage;
