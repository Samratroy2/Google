import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import StatCard from '../components/UI/StatCard';
import Badge from '../components/UI/Badge';
import Button from '../components/UI/Button';
import { URGENCY_COLORS, STATUS_COLORS, TYPE_ICONS, SKILL_COLORS } from '../data/mockData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { toast } from 'react-toastify';
import styles from './AdminPage.module.css';

const TABS = ['Overview', 'Needs', 'Volunteers', 'Analytics'];

function AdminPage() {
  const { needs, volunteers, updateNeedStatus, deleteNeed } = useApp();
  const [tab, setTab] = useState('Overview');

  const total     = needs.length;
  const pending   = needs.filter(n => n.status === 'Pending').length;
  const assigned  = needs.filter(n => n.status === 'Assigned').length;
  const completed = needs.filter(n => n.status === 'Completed').length;
  const totalVols = volunteers.length;
  const available = volunteers.filter(v => v.available).length;
  const rate      = total ? Math.round((completed / total) * 100) : 0;

  // Fake weekly trend
  const weekData = [
    { day: 'Mon', needs: 4, resolved: 3 },
    { day: 'Tue', needs: 6, resolved: 5 },
    { day: 'Wed', needs: 3, resolved: 3 },
    { day: 'Thu', needs: 8, resolved: 6 },
    { day: 'Fri', needs: 5, resolved: 4 },
    { day: 'Sat', needs: 7, resolved: 7 },
    { day: 'Sun', needs: 4, resolved: 3 },
  ];

  const typeData = Object.entries(
    needs.reduce((acc, n) => { acc[n.type] = (acc[n.type] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  const handleDelete = (id) => {
    if (window.confirm('Delete this need?')) {
      deleteNeed(id);
      toast.info('Need deleted');
    }
  };

  const tooltipStyle = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)' };

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Admin Panel</h1>
          <p className={styles.sub}>Full control and monitoring</p>
        </div>
        <div className={styles.adminBadge}>⚙️ Administrator</div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {TABS.map(t => (
          <button key={t} className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div>
          <div className={styles.statsGrid}>
            <StatCard icon="📋" label="Total Needs"      value={total}     color="#6366f1" />
            <StatCard icon="⏳" label="Pending"          value={pending}   color="#f97316" />
            <StatCard icon="🔄" label="Assigned"         value={assigned}  color="#3b82f6" />
            <StatCard icon="✅" label="Completed"        value={completed} color="#22c55e" />
            <StatCard icon="🙋" label="Total Volunteers" value={totalVols} color="#8b5cf6" />
            <StatCard icon="🟢" label="Available"        value={available} color="#22c55e" />
            <StatCard icon="📈" label="Completion Rate"  value={`${rate}%`} color="#f59e0b" />
          </div>

          <div className={styles.chartsRow}>
            <div className={styles.chartCard}>
              <h3 className={styles.cardTitle}>Weekly Needs vs Resolved</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={weekData}>
                  <XAxis dataKey="day" tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="needs"    stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} />
                  <Line type="monotone" dataKey="resolved" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
              <div className={styles.chartLegend}>
                <span><span className={styles.dot} style={{ background: '#6366f1' }} /> Needs Posted</span>
                <span><span className={styles.dot} style={{ background: '#22c55e' }} /> Resolved</span>
              </div>
            </div>

            <div className={styles.chartCard}>
              <h3 className={styles.cardTitle}>Needs by Type</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={typeData} layout="vertical">
                  <XAxis type="number" tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" fill="#6366f1" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'Needs' && (
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <h3 className={styles.cardTitle}>All Needs ({needs.length})</h3>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {['Type', 'Title', 'Location', 'Urgency', 'Status', 'Posted By', 'Qty', 'Actions'].map(h => (
                    <th key={h} className={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {needs.map(n => (
                  <tr key={n.id} className={styles.tr}>
                    <td className={styles.td}>{TYPE_ICONS[n.type]} {n.type}</td>
                    <td className={styles.td}><span className={styles.tdTitle}>{n.title}</span></td>
                    <td className={styles.td}><span className={styles.muted}>{n.location}</span></td>
                    <td className={styles.td}><Badge text={n.urgency} color={URGENCY_COLORS[n.urgency]} size="sm" /></td>
                    <td className={styles.td}><Badge text={n.status}  color={STATUS_COLORS[n.status]}  size="sm" /></td>
                    <td className={styles.td}><span className={styles.muted}>{n.postedBy}</span></td>
                    <td className={styles.td}>{n.qty} {n.unit}</td>
                    <td className={styles.td}>
                      <div className={styles.rowActions}>
                        {n.status === 'Pending' && (
                          <button className={styles.actionBtn} onClick={() => { updateNeedStatus(n.id, 'Assigned'); toast.success('Marked as Assigned'); }}>Assign</button>
                        )}
                        {n.status === 'Assigned' && (
                          <button className={styles.actionBtn} onClick={() => { updateNeedStatus(n.id, 'Completed'); toast.success('Marked as Completed'); }}>Complete</button>
                        )}
                        <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => handleDelete(n.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'Volunteers' && (
        <div className={styles.tableCard}>
          <h3 className={styles.cardTitle}>All Volunteers ({volunteers.length})</h3>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {['Name', 'Skill', 'Location', 'Distance', 'Availability', 'Tasks Done', 'Rating'].map(h => (
                    <th key={h} className={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {volunteers.map(v => (
                  <tr key={v.id} className={styles.tr}>
                    <td className={styles.td}>
                      <div className={styles.volNameCell}>
                        <div className={styles.miniAvatar} style={{ background: SKILL_COLORS[v.skill] + '33', color: SKILL_COLORS[v.skill] }}>{v.avatar}</div>
                        {v.name}
                      </div>
                    </td>
                    <td className={styles.td}><Badge text={v.skill} color={SKILL_COLORS[v.skill] || '#64748b'} size="sm" /></td>
                    <td className={styles.td}><span className={styles.muted}>{v.location}</span></td>
                    <td className={styles.td}>{v.distance} km</td>
                    <td className={styles.td}><Badge text={v.available ? 'Available' : 'Busy'} color={v.available ? '#22c55e' : '#ef4444'} size="sm" /></td>
                    <td className={styles.td}>{v.tasksCompleted}</td>
                    <td className={styles.td}>⭐ {v.rating}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'Analytics' && (
        <div>
          <div className={styles.analyticsGrid}>
            {[
              { label: 'Avg response time', value: '14 min', icon: '⏱️', color: '#3b82f6' },
              { label: 'Volunteer utilisation', value: `${Math.round((available / totalVols) * 100)}%`, icon: '📊', color: '#8b5cf6' },
              { label: 'Critical resolved', value: `${needs.filter(n => n.urgency === 'Critical' && n.status === 'Completed').length}`, icon: '🚨', color: '#ef4444' },
              { label: 'Resources saved', value: '₹2.4L', icon: '💰', color: '#22c55e' },
            ].map(m => (
              <div key={m.label} className={styles.metricCard}>
                <div className={styles.metricIcon}>{m.icon}</div>
                <div className={styles.metricVal} style={{ color: m.color }}>{m.value}</div>
                <div className={styles.metricLabel}>{m.label}</div>
              </div>
            ))}
          </div>

          <div className={styles.chartCard} style={{ marginTop: 20 }}>
            <h3 className={styles.cardTitle}>Weekly Activity Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weekData}>
                <XAxis dataKey="day" tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="needs"    fill="#6366f1" radius={[4, 4, 0, 0]} name="Needs Posted" />
                <Bar dataKey="resolved" fill="#22c55e" radius={[4, 4, 0, 0]} name="Resolved" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPage;
