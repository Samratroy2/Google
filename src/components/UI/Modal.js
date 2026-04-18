import React, { useEffect } from 'react';
import styles from './Modal.module.css';

function Modal({ open, onClose, title, children, width = 500 }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else       document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.box} style={{ maxWidth: width }} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.title}>{title}</div>
          <button className={styles.close} onClick={onClose}>✕</button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}

export default Modal;
