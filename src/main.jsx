import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import { FlagProvider } from './flags/FlagProvider';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <FlagProvider>
          <App />
        </FlagProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
