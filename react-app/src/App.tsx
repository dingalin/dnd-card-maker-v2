import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { CardProvider } from './store';
import { CharacterProvider } from './store/CharacterContext';
import Header from './components/Layout/Header';
import NavigationRail from './components/Layout/NavigationRail';
import './App.css';

// Lazy load feature pages for better initial load performance
const CardCreator = lazy(() => import('./features/CardCreator/CardCreator'));
const CharacterSheet = lazy(() => import('./features/CharacterSheet/CharacterSheet'));
const TreasureGenerator = lazy(() => import('./features/TreasureGenerator/TreasureGenerator'));

// Loading fallback component
const PageLoader = () => (
  <div className="page-loader">
    <div className="loader-spinner"></div>
    <span>טוען...</span>
  </div>
);

function App() {
  return (
    <CardProvider>
      <CharacterProvider>
        <BrowserRouter>
          <div className="app">
            <Header />

            <div className="app-layout">
              {/* Left Navigation Rail */}
              <NavigationRail />

              {/* Main Content Area */}
              <main className="app-main">
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<CardCreator />} />
                    <Route path="/character-sheet" element={<CharacterSheet />} />
                    <Route path="/treasure-generator" element={<TreasureGenerator />} />
                  </Routes>
                </Suspense>
              </main>
            </div>
          </div>
        </BrowserRouter>
      </CharacterProvider>
    </CardProvider>
  );
}

export default App;
