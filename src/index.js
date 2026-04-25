import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/global.css';
import { AppProvider } from './context/AppContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        <App />
        <ToastContainer
          position="top-right"
          autoClose={8080}
          hideProgressBar={false}
          theme="dark"
        />
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>
);
