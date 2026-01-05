import React from "react";

export default function Navbar({ onToggleDate, onToggleHelp }) {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="brand">Word Chain</div>
        <div className="nav-actions">
          <button className="nav-btn" onClick={onToggleHelp} aria-label="How to play">?</button>
          <button className="nav-btn" onClick={onToggleDate} aria-label="Select date">🗓️</button>
        </div>
      </div>
    </header>
  );
}
