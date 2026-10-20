import React from 'react';
import { createRoot } from 'react-dom/client';
import ImageList from './components/ImageList.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ImageList />
  </React.StrictMode>,
);
