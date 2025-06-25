import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import CourseRoadmapTool from './tokushima-roadmap-tool';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <CourseRoadmapTool />
  </React.StrictMode>
); 