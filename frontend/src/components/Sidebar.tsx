import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar: React.FC = () => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">Navigation</div>
      <ul className="sidebar-menu">
        <li><Link to="/">Chat</Link></li>
        <li><Link to="/upload">Upload Data</Link></li>
        <li><Link to="/dashboard">Dashboard</Link></li>
      </ul>
    </div>
  );
};

export default Sidebar;
