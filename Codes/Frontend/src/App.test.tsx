import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

// Smoke test: la app debe renderizar sin lanzar excepciones.
// Las llamadas a la API se ignoran (fetch mock por defecto) y los
// componentes muestran sus estados de carga/error.
test('renders app without crashing', () => {
  render(<App />);
});
