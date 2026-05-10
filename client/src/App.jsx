import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Match from './pages/Match.jsx';
import Toss from './pages/Toss.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/match/:code/toss" element={<Toss />} />
        <Route path="/match/:code" element={<Match />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
