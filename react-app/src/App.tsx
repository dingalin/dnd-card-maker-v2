import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CardProvider } from './store';
import CardCreator from './features/CardCreator/CardCreator';
import CharacterSheet from './features/CharacterSheet/CharacterSheet';
import TreasureGenerator from './features/TreasureGenerator/TreasureGenerator';
import Header from './components/Layout/Header';
import NavigationRail from './components/Layout/NavigationRail';
import './App.css';

function App() {
  return (
    <CardProvider>
      <BrowserRouter>
        <div className="app">
          <Header />

          <div className="app-layout">
            {/* Left Navigation Rail */}
            <NavigationRail />

            {/* Main Content Area */}
            <main className="app-main">
              <Routes>
                <Route path="/" element={<CardCreator />} />
                <Route path="/character-sheet" element={<CharacterSheet />} />
                <Route path="/treasure-generator" element={<TreasureGenerator />} />
              </Routes>
            </main>
          </div>
        </div>
      </BrowserRouter>
    </CardProvider>
  );
}

export default App;
