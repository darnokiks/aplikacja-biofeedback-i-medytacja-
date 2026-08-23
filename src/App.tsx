import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import Home from './pages/Home';
import WimHof from './pages/WimHof';
import Jacobson from './pages/Jacobson';
import Schultz from './pages/Schultz';
import Meditation from './pages/Meditation';
import Focus from './pages/Focus';
import Games from './pages/Games';
import ReactionGame from './pages/games/ReactionGame';
import MemoryGame from './pages/games/MemoryGame';
import NBackGame from './pages/games/NBackGame';
import Biofeedback from './pages/Biofeedback';
import Progress from './pages/Progress';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/oddech" element={<WimHof />} />
          <Route path="/jacobson" element={<Jacobson />} />
          <Route path="/schultz" element={<Schultz />} />
          <Route path="/medytacja" element={<Meditation />} />
          <Route path="/focus" element={<Focus />} />
          <Route path="/gry" element={<Games />} />
          <Route path="/gry/reakcja" element={<ReactionGame />} />
          <Route path="/gry/pamiec" element={<MemoryGame />} />
          <Route path="/gry/nback" element={<NBackGame />} />
          <Route path="/biofeedback" element={<Biofeedback />} />
          <Route path="/postepy" element={<Progress />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
