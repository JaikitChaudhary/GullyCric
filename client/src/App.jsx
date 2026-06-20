import { BrowserRouter, Route, Routes } from 'react-router-dom';
import BottomNavigation from './components/BottomNavigation.jsx';
import Home from './pages/Home.jsx';
import Match from './pages/Match.jsx';
import Toss from './pages/Toss.jsx';
import CreateTournament from './pages/CreateTournament.jsx';
import TournamentDetails from './pages/TournamentDetails.jsx';
import TournamentList from './pages/TournamentList.jsx';
import AddPlayer from './pages/AddPlayer.jsx';
import EditPlayer from './pages/EditPlayer.jsx';
import PlayerList from './pages/PlayerList.jsx';
import CreateTeam from './pages/CreateTeam.jsx';
import EditTeam from './pages/EditTeam.jsx';
import TeamDetails from './pages/TeamDetails.jsx';
import TeamList from './pages/TeamList.jsx';
import MatchHub from './pages/MatchHub.jsx';
import PlayersHub from './pages/PlayersHub.jsx';
import PointsTable from './pages/PointsTable.jsx';
import Profile from './pages/Profile.jsx';
import DraftMode from './pages/DraftMode.jsx';

function App() {
  return (
    <BrowserRouter>
      <div className="pb-24">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/match" element={<MatchHub />} />
          <Route path="/players" element={<PlayersHub />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/tournaments" element={<TournamentList />} />
          <Route path="/tournaments/create" element={<CreateTournament />} />
          <Route path="/tournaments/:id/players" element={<PlayerList />} />
          <Route path="/tournaments/:id/players/add" element={<AddPlayer />} />
          <Route path="/tournaments/:id/players/:playerId/edit" element={<EditPlayer />} />
          <Route path="/tournaments/:id/teams" element={<TeamList />} />
          <Route path="/tournaments/:id/teams/create" element={<CreateTeam />} />
          <Route path="/tournaments/:id/teams/:teamId" element={<TeamDetails />} />
          <Route path="/tournaments/:id/teams/:teamId/edit" element={<EditTeam />} />
          <Route path="/tournaments/:id/points-table" element={<PointsTable />} />
          <Route path="/tournaments/:id/draft" element={<DraftMode />} />
          <Route path="/tournaments/:id" element={<TournamentDetails />} />
          <Route path="/match/:code/toss" element={<Toss />} />
          <Route path="/match/:code" element={<Match />} />
        </Routes>
      </div>
      <BottomNavigation />
    </BrowserRouter>
  );
}

export default App;
