import React from 'react';
import styles from './Input.module.css';

function Input({ label, type = 'text', value, onChange, placeholder, required, error, hint }) {
  return (
    <div className={styles.wrap}>
      {label && <label className={styles.label}>{label}{required && <span className={styles.req}>*</span>}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${styles.input} ${error ? styles.err : ''}`}
      />
      {error && <div className={styles.errorMsg}>{error}</div>}
      {hint  && <div className={styles.hint}>{hint}</div>}
    </div>
  );
}

export default Input;
