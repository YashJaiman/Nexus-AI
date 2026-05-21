import React from 'react';
import { Link } from 'react-router-dom';
import './InfoPage.css';

export default function InfoPage({ title, subtitle }) {
  return (
    <div className="info-page">
      <div className="info-shell glass">
        <div className="info-badge">Nexus AI</div>
        <h1 className="info-title">{title}</h1>
        <p className="info-subtitle">{subtitle}</p>
        <p className="info-copy">
          This page is live as a branded placeholder so navigation works cleanly while the full content is being prepared.
        </p>
        <div className="info-actions">
          <Link to="/" className="info-link info-link-primary">Back Home</Link>
          <Link to="/dashboard" className="info-link">Open Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
