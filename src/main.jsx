import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import { FlagProvider } from './flags/FlagProvider';
import { PricingProvider } from './lib/pricing';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <FlagProvider>
          <PricingProvider>
            <App />
          </PricingProvider>
        </FlagProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
