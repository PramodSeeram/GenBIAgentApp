import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import FileUpload from './components/FileUpload';
import ChatInterface from './components/ChatInterface';
import Dashboard from './components/Dashboard';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';

function App() {
  return (
    <Router>
      <div className="App">
        <TopBar />
        <div className="main-container">
          <Sidebar />
          <div className="content">
            <Routes>
              <Route path="/" element={<ChatInterface />} />
              <Route path="/upload" element={<FileUpload />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
