import { HashRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AlarmEngine } from './components/AlarmEngine';
import Home from './pages/Home';
import WimHof from './pages/WimHof';
import Jacobson from './pages/Jacobson';
import Schultz from './pages/Schultz';
import Meditation from './pages/Meditation';
import Focus from './pages/Focus';
import LightJourney from './pages/LightJourney';
import Music from './pages/Music';
import Games from './pages/Games';
import ReactionGame from './pages/games/ReactionGame';
import MemoryGame from './pages/games/MemoryGame';
import NBackGame from './pages/games/NBackGame';
import Biofeedback from './pages/Biofeedback';
import Devices from './pages/Devices';
import Progress from './pages/Progress';
import Alarms from './pages/Alarms';
import Login from './pages/Login';
import Privacy from './pages/Privacy';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <HashRouter>
      <AlarmEngine />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/oddech" element={<WimHof />} />
          <Route path="/jacobson" element={<Jacobson />} />
          <Route path="/schultz" element={<Schultz />} />
          <Route path="/medytacja" element={<Meditation />} />
          <Route path="/focus" element={<Focus />} />
          <Route path="/swiatlo" element={<LightJourney />} />
          <Route path="/muzyka" element={<Music />} />
          <Route path="/gry" element={<Games />} />
          <Route path="/gry/reakcja" element={<ReactionGame />} />
          <Route path="/gry/pamiec" element={<MemoryGame />} />
          <Route path="/gry/nback" element={<NBackGame />} />
          <Route path="/biofeedback" element={<Biofeedback />} />
          <Route path="/urzadzenia" element={<Devices />} />
          <Route path="/postepy" element={<Progress />} />
          <Route path="/budzik" element={<Alarms />} />
          <Route path="/logowanie" element={<Login />} />
          <Route path="/prywatnosc" element={<Privacy />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}
