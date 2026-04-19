import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import StatCard from '../components/UI/StatCard';
import Badge from '../components/UI/Badge';
import Button from '../components/UI/Button';
import {
  STATUS_COLORS,
  TYPE_ICONS
} from '../data/mockData';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import styles from './Dashboard.module.css';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6'];

function Dashboard() {

  const { needs = [], users = [] } = useApp();
  const navigate = useNavigate();

  const volunteers = users.filter(u => u.role === "Volunteer");

  const total     = needs.length;
  const pending   = needs.filter(n => n.status === 'Pending').length;
  const assigned  = needs.filter(n => n.status === 'Assigned').length;
  const completed = needs.filter(n => n.status === 'Completed').length;

  const available = volunteers.filter(v => v.available).length;

  const byType = Object.entries(
    needs.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const byStatus = [
    { name: 'Pending', value: pending },
    { name: 'Assigned', value: assigned },
    { name: 'Completed', value: completed },
  ];

  const completionRate = total
    ? Math.round((completed / total) * 100)
    : 0;

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.sub}>Real-time overview of resource allocation</p>
        </div>
        <Button onClick={() => navigate('/needs/post')}>
          + Post New Need
        </Button>
      </div>

      {/* Stat Cards */}
      <div className={styles.statsGrid}>
        <StatCard icon="📋" label="Total Needs" value={total} color="#6366f1" />
        <StatCard icon="⏳" label="Pending" value={pending} color="#f97316" />
        <StatCard icon="🔄" label="Assigned" value={assigned} color="#3b82f6" />
        <StatCard icon="✅" label="Completed" value={completed} color="#22c55e" />
        <StatCard icon="🙋" label="Active Volunteers" value={available} color="#8b5cf6" />
        <StatCard icon="📈" label="Completion Rate" value={`${completionRate}%`} color="#f59e0b" />
      </div>

      {/* Charts */}
      <div className={styles.chartsRow}>
        <div className={styles.chartCard}>
          <h3 className={styles.cardTitle}>Needs by Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byType}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value">
                {byType.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.cardTitle}>Status Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={byStatus}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={70}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {byStatus.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>

              <Tooltip />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className={styles.bottomRow}>
        <div className={styles.activityCard}>
          <h3 className={styles.cardTitle}>Recent Activity</h3>

          {needs.slice(0, 5).map(n => (
            <div key={n.id} className={styles.activityItem}>
              <span>{TYPE_ICONS[n.type]}</span>
              <div>
                <div>{n.title}</div>
                <div>{n.timeAgo} · {n.location}</div>
              </div>
              <Badge text={n.status} color={STATUS_COLORS[n.status]} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;