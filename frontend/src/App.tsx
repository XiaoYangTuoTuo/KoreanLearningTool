import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Typing from './pages/Typing';
import Grammar from './pages/Grammar';
import Vocabulary from './pages/Vocabulary';
import Profile from './pages/Profile';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="typing" element={<Typing />} />
          <Route path="grammar" element={<Grammar />} />
          <Route path="vocabulary" element={<Vocabulary />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
