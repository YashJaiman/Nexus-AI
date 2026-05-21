import React from 'react';
import { PROJECTS } from '../data/projects';
import './Projects.css';

export default function ProjectsSection() {
  const hasProjects = PROJECTS.length > 0;

  return (
    <div className="pr-root">
      <div className="pr-header fade-in">
        <h1 className="pr-title">Projects Space</h1>
        <p className="pr-subtitle">Track the initiatives currently shaping Nexus AI.</p>
      </div>

      {hasProjects ? (
        <div className="pr-grid">
          {PROJECTS.map((project, index) => (
            <article
              key={project.id}
              className="pr-card fade-in"
              style={{ animationDelay: `${index * 80}ms`, '--project-color': project.color }}
            >
              <div className="pr-card-top">
                <div>
                  <h2 className="pr-card-title">{project.name}</h2>
                  <p className="pr-card-summary">{project.summary}</p>
                </div>
                <span className={`pr-status pr-status-${project.status}`}>{project.status}</span>
              </div>

              <div className="pr-meta-row">
                <span>{project.tasks} linked tasks</span>
                <span>{project.progress}% complete</span>
              </div>

              <div className="pr-progress-track">
                <div className="pr-progress-fill" style={{ width: `${project.progress}%` }} />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="pr-empty glass">
          <h3>No active projects yet</h3>
          <p>Create your first project to start tracking milestones and progress.</p>
        </div>
      )}
    </div>
  );
}
