import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import StatCard from '../components/UI/StatCard';
import Badge from '../components/UI/Badge';
import Button from '../components/UI/Button';
import { URGENCY_COLORS, STATUS_COLORS, TYPE_ICONS, DEMAND_PREDICTIONS } from '../data/mockData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import styles from './Dashboard.module.css';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6'];

function Dashboard() {
  const { needs, volunteers } = useApp();
  const navigate = useNavigate();

  const total     = needs.length;
  const pending   = needs.filter(n => n.status === 'Pending').length;
  const assigned  = needs.filter(n => n.status === 'Assigned').length;
  const completed = needs.filter(n => n.status === 'Completed').length;
  const available = volunteers.filter(v => v.available).length;

  const byType = Object.entries(
    needs.reduce((acc, n) => { acc[n.type] = (acc[n.type] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  const byStatus = [
    { name: 'Pending',   value: pending },
    { name: 'Assigned',  value: assigned },
    { name: 'Completed', value: completed },
  ];

  const completionRate = total ? Math.round((completed / total) * 100) : 0;

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.sub}>Real-time overview of resource allocation</p>
        </div>
        <Button onClick={() => navigate('/needs/post')}>+ Post New Need</Button>
      </div>

      {/* Stat Cards */}
      <div className={styles.statsGrid}>
        <StatCard icon="📋" label="Total Needs"      value={total}     color="#6366f1" />
        <StatCard icon="⏳" label="Pending"          value={pending}   color="#f97316" />
        <StatCard icon="🔄" label="Assigned"         value={assigned}  color="#3b82f6" />
        <StatCard icon="✅" label="Completed"        value={completed} color="#22c55e" />
        <StatCard icon="🙋" label="Active Volunteers" value={available} color="#8b5cf6" />
        <StatCard icon="📈" label="Completion Rate"  value={`${completionRate}%`} color="#f59e0b" />
      </div>

      {/* Charts Row */}
      <div className={styles.chartsRow}>
        <div className={styles.chartCard}>
          <h3 className={styles.cardTitle}>Needs by Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byType} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)' }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {byType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.cardTitle}>Status Distribution</h3>
          <div className={styles.pieWrap}>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={byStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                  {byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className={styles.legend}>
              {byStatus.map((s, i) => (
                <div key={s.name} className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: COLORS[i] }} />
                  <span>{s.name}: <strong>{s.value}</strong></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity + Demand Prediction */}
      <div className={styles.bottomRow}>
        <div className={styles.activityCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Recent Activity</h3>
            <button className={styles.viewAll} onClick={() => navigate('/needs')}>View all →</button>
          </div>
          {needs.slice(0, 5).map(n => (
            <div key={n.id} className={styles.activityItem}>
              <span className={styles.activityIcon}>{TYPE_ICONS[n.type]}</span>
              <div className={styles.activityInfo}>
                <div className={styles.activityTitle}>{n.title}</div>
                <div className={styles.activityMeta}>{n.timeAgo} · {n.location}</div>
              </div>
              <Badge text={n.status} color={STATUS_COLORS[n.status]} size="sm" />
            </div>
          ))}
        </div>

        <div className={styles.predCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>🔮 AI Demand Predictions</h3>
          </div>
          <p className={styles.predSub}>Based on historical patterns — predicted needs:</p>
          {DEMAND_PREDICTIONS.map(p => (
            <div key={p.area} className={styles.predItem}>
              <div className={styles.predTop}>
                <span className={styles.predArea}>{p.area}</span>
                <span className={styles.predProb} style={{ color: p.probability > 75 ? '#ef4444' : p.probability > 55 ? '#f59e0b' : '#22c55e' }}>
                  {p.probability}%
                </span>
              </div>
              <div className={styles.predNeed}>{p.need} · {p.timeframe}</div>
              <div className={styles.predBar}>
                <div className={styles.predFill} style={{
                  width: `${p.probability}%`,
                  background: p.probability > 75 ? '#ef4444' : p.probability > 55 ? '#f59e0b' : '#22c55e'
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
