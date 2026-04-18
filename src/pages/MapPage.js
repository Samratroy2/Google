import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Badge from '../components/UI/Badge';
import { URGENCY_COLORS, STATUS_COLORS, TYPE_ICONS, SKILL_COLORS } from '../data/mockData';
import styles from './MapPage.module.css';

// Map bounds
const W = 700, H = 420;
const MIN_LAT = 23.52, MAX_LAT = 23.58, MIN_LNG = 87.28, MAX_LNG = 87.37;

function toXY(lat, lng) {
  return {
    x: ((lng - MIN_LNG) / (MAX_LNG - MIN_LNG)) * (W - 100) + 50,
    y: ((MAX_LAT - lat) / (MAX_LAT - MIN_LAT)) * (H - 100) + 50,
  };
}

function MapPage() {
  const { needs, volunteers } = useApp();
  const [selected, setSelected]     = useState(null);
  const [showNeeds, setShowNeeds]   = useState(true);
  const [showVols,  setShowVols]    = useState(true);

  // Give volunteers stable map positions
  const volsWithPos = volunteers.slice(0, 6).map((v, i) => ({
    ...v,
    lat: 23.525 + i * 0.011 + (i % 2 === 0 ? 0.003 : -0.002),
    lng: 87.29  + i * 0.014 + (i % 3 === 0 ? 0.004 : 0.001),
  }));

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Live Map View</h1>
          <p className={styles.sub}>Real-time locations of needs and volunteers</p>
        </div>
        <div className={styles.toggles}>
          <button className={`${styles.toggle} ${showNeeds ? styles.toggleActive : ''}`}
            onClick={() => setShowNeeds(s => !s)}>
            🔴 Needs
          </button>
          <button className={`${styles.toggle} ${showVols ? styles.toggleActive : ''}`}
            onClick={() => setShowVols(s => !s)}>
            🟢 Volunteers
          </button>
        </div>
      </div>

      <div className={styles.mapWrap}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} className={styles.svg}>
          {/* Background */}
          <rect width={W} height={H} fill="var(--surface)" rx="16" />

          {/* Grid lines */}
          {Array.from({ length: 9 }).map((_, i) => (
            <line key={`h${i}`} x1={0} y1={i * H / 8} x2={W} y2={i * H / 8} stroke="var(--border)" strokeWidth={0.8} />
          ))}
          {Array.from({ length: 11 }).map((_, i) => (
            <line key={`v${i}`} x1={i * W / 10} y1={0} x2={i * W / 10} y2={H} stroke="var(--border)" strokeWidth={0.8} />
          ))}

          {/* Roads (simulated) */}
          {[
            [60, 60, 640, 360], [60, 210, 640, 210], [350, 40, 350, 390],
            [120, 90, 580, 340], [200, 380, 500, 80],
          ].map((r, i) => (
            <line key={`r${i}`} x1={r[0]} y1={r[1]} x2={r[2]} y2={r[3]}
              stroke="var(--border)" strokeWidth={i < 2 ? 3 : 2} strokeDasharray={i > 2 ? '6 4' : ''} opacity={0.6} />
          ))}

          {/* Heatmap halos for high-urgency needs */}
          {showNeeds && needs
            .filter(n => n.status !== 'Completed' && (n.urgency === 'Critical' || n.urgency === 'High'))
            .map(n => {
              const { x, y } = toXY(n.lat, n.lng);
              return (
                <circle key={`h${n.id}`} cx={x} cy={y} r={52}
                  fill={URGENCY_COLORS[n.urgency]} opacity={0.07} />
              );
            })}

          {/* Need markers */}
          {showNeeds && needs.filter(n => n.status !== 'Completed').map(n => {
            const { x, y } = toXY(n.lat, n.lng);
            const isSelected = selected?.id === n.id && selected?.kind === 'need';
            return (
              <g key={n.id} className={styles.marker} onClick={() => setSelected(isSelected ? null : { ...n, kind: 'need' })} style={{ cursor: 'pointer' }}>
                <circle cx={x} cy={y} r={isSelected ? 18 : 14} fill={URGENCY_COLORS[n.urgency]} opacity={0.9} />
                <circle cx={x} cy={y} r={isSelected ? 8 : 6}  fill="#fff" opacity={0.9} />
                <text x={x} y={y + 28} textAnchor="middle" fontSize={10} fill="var(--text)" fontWeight="700">
                  {n.type}
                </text>
              </g>
            );
          })}

          {/* Volunteer markers */}
          {showVols && volsWithPos.map(v => {
            const { x, y } = toXY(v.lat, v.lng);
            const isSelected = selected?.id === v.id && selected?.kind === 'vol';
            const color = v.available ? '#22c55e' : '#94a3b8';
            return (
              <g key={v.id} className={styles.marker} onClick={() => setSelected(isSelected ? null : { ...v, kind: 'vol' })} style={{ cursor: 'pointer' }}>
                <polygon
                  points={`${x},${y - (isSelected ? 18 : 14)} ${x - (isSelected ? 12 : 9)},${y + (isSelected ? 8 : 6)} ${x + (isSelected ? 12 : 9)},${y + (isSelected ? 8 : 6)}`}
                  fill={color} opacity={0.95}
                />
                <text x={x} y={y + 24} textAnchor="middle" fontSize={10} fill="var(--text)" fontWeight="600">
                  {v.name.split(' ')[0]}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip / info panel */}
        {selected && (
          <div className={styles.tooltip}>
            <button className={styles.tooltipClose} onClick={() => setSelected(null)}>✕</button>
            {selected.kind === 'need' ? (
              <>
                <div className={styles.tooltipIcon}>{TYPE_ICONS[selected.type]}</div>
                <div className={styles.tooltipTitle}>{selected.title}</div>
                <div className={styles.tooltipMeta}>{selected.location}</div>
                <div className={styles.tooltipBadges}>
                  <Badge text={selected.urgency} color={URGENCY_COLORS[selected.urgency]} size="sm" />
                  <Badge text={selected.status}  color={STATUS_COLORS[selected.status]}  size="sm" />
                </div>
                <div className={styles.tooltipDetail}>Qty: {selected.qty} {selected.unit}</div>
              </>
            ) : (
              <>
                <div className={styles.tooltipAvatar} style={{ background: SKILL_COLORS[selected.skill] + '33', color: SKILL_COLORS[selected.skill] }}>
                  {selected.avatar}
                </div>
                <div className={styles.tooltipTitle}>{selected.name}</div>
                <div className={styles.tooltipMeta}>{selected.skill} · {selected.location}</div>
                <Badge text={selected.available ? 'Available' : 'Busy'} color={selected.available ? '#22c55e' : '#ef4444'} size="sm" />
                <div className={styles.tooltipDetail}>{selected.distance} km away · {selected.tasksCompleted} tasks</div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Legend + summary */}
      <div className={styles.legend}>
        <div className={styles.legendItem}><span className={styles.dot} style={{ background: '#ef4444' }} /> Critical need</div>
        <div className={styles.legendItem}><span className={styles.dot} style={{ background: '#f97316' }} /> High need</div>
        <div className={styles.legendItem}><span className={styles.dot} style={{ background: '#eab308' }} /> Medium need</div>
        <div className={styles.legendItem}><span className={styles.tri} style={{ borderBottomColor: '#22c55e' }} /> Available volunteer</div>
        <div className={styles.legendItem}><span className={styles.tri} style={{ borderBottomColor: '#94a3b8' }} /> Busy volunteer</div>
      </div>

      {/* Sidebar lists */}
      <div className={styles.lists}>
        <div className={styles.listCard}>
          <h3 className={styles.listTitle}>🔴 Active Needs ({needs.filter(n => n.status !== 'Completed').length})</h3>
          {needs.filter(n => n.status !== 'Completed').map(n => (
            <div key={n.id} className={styles.listItem} onClick={() => setSelected({ ...n, kind: 'need' })}>
              <span>{TYPE_ICONS[n.type]}</span>
              <div className={styles.listInfo}>
                <div className={styles.listName}>{n.title}</div>
                <div className={styles.listMeta}>{n.location}</div>
              </div>
              <Badge text={n.urgency} color={URGENCY_COLORS[n.urgency]} size="sm" />
            </div>
          ))}
        </div>

        <div className={styles.listCard}>
          <h3 className={styles.listTitle}>🟢 Available Volunteers ({volunteers.filter(v => v.available).length})</h3>
          {volunteers.filter(v => v.available).map(v => (
            <div key={v.id} className={styles.listItem} onClick={() => setSelected({ ...v, kind: 'vol', lat: 23.53, lng: 87.31 })}>
              <div className={styles.miniAvatar} style={{ background: SKILL_COLORS[v.skill] + '33', color: SKILL_COLORS[v.skill] }}>{v.avatar}</div>
              <div className={styles.listInfo}>
                <div className={styles.listName}>{v.name}</div>
                <div className={styles.listMeta}>{v.skill} · {v.distance} km</div>
              </div>
              <span className={styles.ratingBadge}>⭐ {v.rating}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MapPage;
