/* 
  Card Component Example
  A reusable card component with glassmorphism effect.
  
  Usage:
  <Card title="Title" className="glass-primary">
    Card content here
  </Card>
*/

import './Card.css'

function Card({ 
  children, 
  title, 
  subtitle, 
  className = '',
  ...props 
}) {
  return (
    <div className={`card glass ${className}`} {...props}>
      {title && (
        <div className="card-header">
          <h3 className="card-title">{title}</h3>
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
      )}
      <div className="card-content">
        {children}
      </div>
    </div>
  )
}

export default Card
