// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AppProvider } from './store/AppContext';
import { DashboardContainer } from './features/co2-dashboard';
import { SensorDetailContainer } from './features/sensor-detail';
import PlaceholderPage from './features/shared/PlaceholderPage';
import NotFoundPage from './features/shared/NotFoundPage';

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<DashboardContainer />} />
            <Route path="/sensor/:id" element={<SensorDetailContainer />} />
            <Route path="/config" element={<PlaceholderPage title="Configuración" icon="config" />} />
            <Route path="/help" element={<PlaceholderPage title="Ayuda" icon="help" />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;
