import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';

function AdminVerifyPage() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, []);

  const approve = async (id) => {
    await updateDoc(doc(db, "users", id), {
      status: "approved"
    });
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Admin Verification</h2>

      {users.map(u => (
        <div key={u.id} style={{ marginBottom: 10 }}>
          <b>{u.email}</b> — {u.role} — {u.status}

          {u.status === "pending" && (
            <button onClick={() => approve(u.id)}>
              Approve
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default AdminVerifyPage;