import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import { FeProvider } from './fe/FeProvider';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <FeProvider>
          <App />
        </FeProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
