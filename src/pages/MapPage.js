import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { GoogleMap, Marker, OverlayView } from '@react-google-maps/api';
import Badge from '../components/UI/Badge';
import {
  URGENCY_COLORS,
  STATUS_COLORS,
  TYPE_ICONS,
  SKILL_COLORS
} from '../data/mockData';
import styles from './MapPage.module.css';

const containerStyle = {
  width: '100%',
  height: '520px'
};

const defaultCenter = {
  lat: 23.55,
  lng: 87.30
};

function MapPage() {
  const { needs, users } = useApp();

  const [selected, setSelected] = useState(null);
  const [showNeeds, setShowNeeds] = useState(true);
  const [showVols, setShowVols] = useState(true);

  // ✅ FIX: force map refresh when data changes
  const mapKey = `${needs.length}-${users.length}`;

  // ✅ SAME LOGIC
  const volunteers = users.filter(u =>
    (u.role || '').toLowerCase() === "volunteer" &&
    (u.status || 'approved') !== "blocked" &&
    u.lat && u.lng
  );

  const validNeeds = needs.filter(n => n.lat && n.lng);

  const allPoints = [...validNeeds, ...volunteers];
  const center = allPoints.length
    ? { lat: allPoints[0].lat, lng: allPoints[0].lng }
    : defaultCenter;

  return (
    <div>

      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Live Map View</h1>
          <p className={styles.sub}>
            Real-time locations of needs and volunteers
          </p>
        </div>

        <div className={styles.toggles}>
          <button
            className={`${styles.toggle} ${showNeeds ? styles.toggleActive : ''}`}
            onClick={() => setShowNeeds(s => !s)}
          >
            🔴 Needs
          </button>

          <button
            className={`${styles.toggle} ${showVols ? styles.toggleActive : ''}`}
            onClick={() => setShowVols(s => !s)}
          >
            🟢 Volunteers
          </button>
        </div>
      </div>

      {/* MAP */}
      <GoogleMap
        key={mapKey}   // 🔥 IMPORTANT FIX
        mapContainerStyle={containerStyle}
        center={center}
        zoom={12}
      >

        {/* 🔴 NEEDS */}
        {showNeeds && validNeeds.map(n => (
          <OverlayView
            key={`need-${n.id}`}   // 🔥 FIX
            position={{ lat: n.lat, lng: n.lng }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <div
              onClick={() => setSelected({ ...n, kind: 'need' })}
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: '#ef4444',
                position: 'relative',
                cursor: 'pointer'
              }}
            >
              <div style={{
                position: 'absolute',
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: '#ef4444',
                animation: 'pulse 1.5s infinite',
                opacity: 0.6
              }} />
            </div>
          </OverlayView>
        ))}

        {/* 🟢 VOLUNTEERS */}
        {showVols && volunteers.map(v => (
          <Marker
            key={`vol-${v.uid}`}   // 🔥 FIX
            position={{ lat: v.lat, lng: v.lng }}
            icon={{
              url: "https://cdn-icons-png.flaticon.com/512/1946/1946429.png",
              scaledSize: new window.google.maps.Size(32, 32)
            }}
            onClick={() =>
              setSelected({
                ...v,
                kind: 'vol',
                name: v.username || v.email?.split('@')[0]
              })
            }
          />
        ))}

        {/* POPUP */}
        {selected && selected.lat && selected.lng && (
          <OverlayView
            position={{ lat: selected.lat, lng: selected.lng }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <div
              style={{
                minWidth: 220,
                background: "var(--card)",
                color: "var(--text)",
                padding: 12,
                borderRadius: 12,
                border: "1px solid var(--border)",
                boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                position: "relative"
              }}
            >
              <div
                onClick={() => setSelected(null)}
                style={{
                  position: "absolute",
                  top: 6,
                  right: 8,
                  cursor: "pointer",
                  fontSize: 14
                }}
              >
                ✕
              </div>

              {selected.kind === 'need' ? (
                <>
                  <div style={{ fontWeight: 'bold', marginBottom: 6 }}>
                    {TYPE_ICONS[selected.type]} {selected.title}
                  </div>

                  <p>📍 {selected.location}</p>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <Badge
                      text={selected.urgency}
                      color={URGENCY_COLORS[selected.urgency]}
                      size="sm"
                    />
                    <Badge
                      text={selected.status}
                      color={STATUS_COLORS[selected.status]}
                      size="sm"
                    />
                  </div>

                  <p>Qty: {selected.qty} {selected.unit}</p>
                </>
              ) : (
                <>
                  <div style={{ fontWeight: 'bold' }}>
                    {selected.name}
                  </div>

                  <p>{selected.skill || 'No skill'}</p>
                  <p>📍 {selected.location}</p>

                  <Badge
                    text={selected.available !== false ? 'Available' : 'Busy'}
                    color={selected.available !== false ? '#22c55e' : '#ef4444'}
                    size="sm"
                  />

                  <p>
                    ⭐ {selected.rating || 0} · {selected.tasksCompleted || 0} tasks
                  </p>
                </>
              )}
            </div>
          </OverlayView>
        )}

      </GoogleMap>

      {/* LISTS */}
      <div className={styles.lists}>

        <div className={styles.listCard}>
          <h3>🔴 Active Needs ({validNeeds.length})</h3>

          {validNeeds.map(n => (
            <div
              key={n.id}
              className={styles.listItem}
              onClick={() => setSelected({ ...n, kind: 'need' })}
            >
              <span>{TYPE_ICONS[n.type]}</span>

              <div className={styles.listInfo}>
                <div className={styles.listName}>{n.title}</div>
                <div className={styles.listMeta}>{n.location}</div>
              </div>

              <Badge
                text={n.urgency}
                color={URGENCY_COLORS[n.urgency]}
                size="sm"
              />
            </div>
          ))}
        </div>

        <div className={styles.listCard}>
          <h3>🟢 Volunteers ({volunteers.length})</h3>

          {volunteers.map(v => (
            <div
              key={v.uid}
              className={styles.listItem}
              onClick={() =>
                setSelected({
                  ...v,
                  kind: 'vol',
                  name: v.username || v.email?.split('@')[0]
                })
              }
            >
              <div
                className={styles.miniAvatar}
                style={{
                  background: (SKILL_COLORS[v.skill] || '#64748b') + '33',
                  color: SKILL_COLORS[v.skill] || '#64748b'
                }}
              >
                {(v.username || v.email || '?')[0]}
              </div>

              <div className={styles.listInfo}>
                <div className={styles.listName}>
                  {v.username || v.email?.split('@')[0]}
                </div>
                <div className={styles.listMeta}>
                  {v.skill || 'No skill'} · {v.location || 'Unknown'}
                </div>
              </div>

              <span className={styles.ratingBadge}>
                ⭐ {v.rating || 0}
              </span>
            </div>
          ))}
        </div>

      </div>

      {/* pulse animation */}
      <style>
        {`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.6; }
          70% { transform: scale(2); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
        `}
      </style>
    </div>
  );
}

export default MapPage;