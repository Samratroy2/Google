import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import StatCard from '../components/UI/StatCard';
import Badge from '../components/UI/Badge';
import Button from '../components/UI/Button';
import { URGENCY_COLORS, STATUS_COLORS, TYPE_ICONS } from '../data/mockData';
import { toast } from 'react-toastify';
import styles from './AdminPage.module.css';

const TABS = ['Overview', 'Needs', 'Volunteers', 'NGOs', 'Verify', 'Users', 'Activity'];

function AdminPage() {
  const {
    needs = [],
    users = [],
    activities = [],
    updateNeedStatus,
    deleteNeed,
    approveUser,
    deleteUserAccount,
    blockUser,
    unblockUser,
    user
  } = useApp();

  const [tab, setTab] = useState('Overview');

  // ❌ BLOCK NON-ADMIN
  if (!user || user.role?.toLowerCase() !== 'admin') {
    return (
      <div style={{ padding: 40 }}>
        <h2>⛔ Access Denied</h2>
        <p>Only admin can access this page</p>
      </div>
    );
  }

  // ✅ Volunteers
  const volunteers = users.filter(
    u => u.role === "Volunteer" && u.status === "approved"
  );

  // ✅ NGOs
  const ngos = users.filter(
    u => u.role === "NGO" && u.status === "approved"
  );

  // ✅ Pending users (for Verify tab)
  const pendingUsers = users.filter(u => u.status === 'pending');

  // 📊 Stats
  const total = needs.length;
  const pending = needs.filter(n => n.status === 'Pending').length;
  const assigned = needs.filter(n => n.status === 'Assigned').length;
  const completed = needs.filter(n => n.status === 'Completed').length;

  const totalVols = volunteers.length;
  const available = volunteers.filter(v => v.available).length;
  const rate = total ? Math.round((completed / total) * 100) : 0;

  const activeUsers = users.filter(u => u.status !== 'deleted');

  // 🔥 HANDLERS
  const handleDelete = (id) => {
    if (window.confirm('Delete this need?')) {
      deleteNeed(id);
      toast.info('Need deleted');
    }
  };

  const handleApprove = async (uid) => {
    await approveUser(uid);
    toast.success("✅ User Approved");
  };

  const handleDeleteUser = async (uid) => {
    if (uid === user.uid) {
      toast.error("❌ You cannot delete yourself");
      return;
    }

    if (window.confirm("Delete this user?")) {
      await deleteUserAccount(uid);
      toast.error("❌ User rejected");
    }
  };

  const handleBlockUser = async (uid) => {
    await blockUser(uid);
    toast.warn("🚫 User blocked");
  };

  const handleUnblockUser = async (uid) => {
    await unblockUser(uid);
    toast.success("🔓 User unblocked");
  };

  const getStatusColor = (status) => {
    if (status === 'approved') return '#22c55e';
    if (status === 'blocked') return '#ef4444';
    return '#64748b';
  };

  // ✅ ONLY ADDITION: Proof renderer
  const renderProof = (url) => {
    if (!url) return '-';
    return (
      <a href={url} target="_blank" rel="noreferrer">
        View
      </a>
    );
  };

  return (
    <div>

      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Admin Panel</h1>
          <p className={styles.sub}>Full control and monitoring</p>
        </div>
        <div className={styles.adminBadge}>⚙️ Administrator</div>
      </div>

      {/* TABS */}
      <div className={styles.tabs}>
        {TABS.map(t => (
          <button
            key={t}
            className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ================= OVERVIEW ================= */}
      {tab === 'Overview' && (
        <div className={styles.statsGrid}>
          <StatCard icon="📋" label="Total Needs" value={total} color="#6366f1" />
          <StatCard icon="⏳" label="Pending" value={pending} color="#f97316" />
          <StatCard icon="🔄" label="Assigned" value={assigned} color="#3b82f6" />
          <StatCard icon="✅" label="Completed" value={completed} color="#22c55e" />
          <StatCard icon="🙋" label="Volunteers" value={totalVols} color="#8b5cf6" />
          <StatCard icon="🟢" label="Available" value={available} color="#22c55e" />
          <StatCard icon="📈" label="Completion Rate" value={`${rate}%`} color="#f59e0b" />
        </div>
      )}

      {/* ================= VERIFY ================= */}
      {tab === 'Verify' && (
        <div className={styles.tableCard}>
          <h3 className={styles.cardTitle}>
            Pending Verification ({pendingUsers.length})
          </h3>

          {pendingUsers.length === 0 ? (
            <div style={{ padding: 20, opacity: 0.7 }}>
              No pending users
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Organization</th>
                  <th>Proof</th> {/* added */}
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {pendingUsers.map(u => (
                  <tr key={u.uid}>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>{u.organization || '-'}</td>
                    <td>{renderProof(u.proofUrl)}</td> {/* added */}

                    <td>
                      <Button onClick={() => handleApprove(u.uid)}>
                        Approve
                      </Button>

                      <Button onClick={() => handleDeleteUser(u.uid)}>
                        Reject
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ================= VOLUNTEERS ================= */}
      {tab === 'Volunteers' && (
        <div className={styles.tableCard}>
          <h3 className={styles.cardTitle}>
            Volunteers ({volunteers.length})
          </h3>

          <table className={styles.table}>
            <thead>
              <tr>
                <th>Email</th>
                <th>Skill</th>
                <th>Location</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {volunteers.map(v => (
                <tr key={v.uid}>
                  <td>{v.email}</td>
                  <td>{v.skill || '-'}</td>
                  <td>{v.location || '-'}</td>
                  <td>
                    <Badge
                      text={v.available ? "Available" : "Busy"}
                      color={v.available ? "#22c55e" : "#ef4444"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= NGOs ================= */}
      {tab === 'NGOs' && (
        <div className={styles.tableCard}>
          <h3 className={styles.cardTitle}>
            NGOs ({ngos.length})
          </h3>

          <table className={styles.table}>
            <thead>
              <tr>
                <th>Email</th>
                <th>Organization</th>
                <th>Location</th>
                <th>Proof</th> {/* added */}
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {ngos.map(n => (
                <tr key={n.uid}>
                  <td>{n.email}</td>
                  <td>{n.organization || '-'}</td>
                  <td>{n.location || '-'}</td>
                  <td>{renderProof(n.proofUrl)}</td> {/* added */}
                  <td>
                    <Badge
                      text={n.available ? "Active" : "Inactive"}
                      color={n.available ? "#22c55e" : "#ef4444"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= USERS ================= */}
      {tab === 'Users' && (
        <div className={styles.tableCard}>
          <h3 className={styles.cardTitle}>
            All Users ({activeUsers.length})
          </h3>

          <table className={styles.table}>
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Proof</th> {/* added */}
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {activeUsers.map(u => (
                <tr key={u.uid}>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{renderProof(u.proofUrl)}</td> {/* added */}

                  <td>
                    <Badge
                      text={u.status}
                      color={getStatusColor(u.status)}
                    />
                  </td>

                  <td>
                    {u.status === 'approved' && (
                      <Button onClick={() => handleBlockUser(u.uid)}>
                        Block
                      </Button>
                    )}

                    {u.status === 'blocked' && (
                      <Button onClick={() => handleUnblockUser(u.uid)}>
                        Unblock
                      </Button>
                    )}

                    <Button
                      disabled={u.uid === user.uid}
                      onClick={() => handleDeleteUser(u.uid)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= NEEDS ================= */}
      {tab === 'Needs' && (
        <div className={styles.tableCard}>
          <h3 className={styles.cardTitle}>All Needs ({needs.length})</h3>

          <table className={styles.table}>
            <thead>
              <tr>
                {['Type','Title','Location','Urgency','Status','Qty','Actions'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {needs.map(n => (
                <tr key={n.id}>
                  <td>{TYPE_ICONS[n.type]} {n.type}</td>
                  <td>{n.title}</td>
                  <td>{n.location}</td>
                  <td><Badge text={n.urgency} color={URGENCY_COLORS[n.urgency]} /></td>
                  <td><Badge text={n.status} color={STATUS_COLORS[n.status]} /></td>
                  <td>{n.qty} {n.unit}</td>

                  <td className={styles.actionCell}>
                    {n.status === 'Pending' && (
                      <Button onClick={() => updateNeedStatus(n.id, 'Assigned')}>
                        Assign
                      </Button>
                    )}

                    <Button onClick={() => handleDelete(n.id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= ACTIVITY ================= */}
      {tab === 'Activity' && (
        <div className={styles.tableCard}>
          <h3 className={styles.cardTitle}>User Activity Logs</h3>

          {activities.length === 0 ? (
            <div style={{ padding: 20, opacity: 0.7 }}>
              No activity found
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Action</th>
                  <th>Time</th>
                </tr>
              </thead>

              <tbody>
                {activities.map(a => (
                  <tr key={a.id}>
                    <td>{a.email}</td>
                    <td>{a.action}</td>
                    <td>
                      {a.createdAt?.toDate
                        ? a.createdAt.toDate().toLocaleString()
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

    </div>
  );
}

export default AdminPage;