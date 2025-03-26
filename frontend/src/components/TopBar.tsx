import React from 'react';
import { Link } from 'react-router-dom';

const TopBar: React.FC = () => {
  return (
    <div className="top-bar">
      <div className="logo">GENBI</div>
      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/upload">Upload</Link>
        <Link to="/dashboard">Dashboard</Link>
      </div>
    </div>
  );
};

export default TopBar;
 