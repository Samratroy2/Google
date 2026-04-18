import React from 'react';
import styles from './Input.module.css'; // reuse input styles

function Select({ label, value, onChange, options = [], required }) {
  return (
    <div className={styles.wrap}>
      {label && <label className={styles.label}>{label}{required && <span className={styles.req}>*</span>}</label>}
      <select value={value} onChange={onChange} className={styles.input}>
        {options.map(opt =>
          typeof opt === 'string'
            ? <option key={opt} value={opt}>{opt}</option>
            : <option key={opt.value} value={opt.value}>{opt.label}</option>
        )}
      </select>
    </div>
  );
}

export default Select;
