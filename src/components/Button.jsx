/* 
  Button Component Example
  This is a reusable button component that can be used across the application.
  
  Usage:
  <Button variant="primary" size="lg">Click Me</Button>
*/

import './Button.css'

function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  onClick,
  className = '',
  ...props 
}) {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
