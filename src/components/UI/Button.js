import React from 'react';
import styles from './Button.module.css';

function Button({ children, onClick, variant = 'primary', size = 'md', disabled, type = 'button', fullWidth }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${styles.btn} ${styles[variant]} ${styles[size]} ${fullWidth ? styles.full : ''} ${disabled ? styles.disabled : ''}`}
    >
      {children}
    </button>
  );
}

export default Button;
