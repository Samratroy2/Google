import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import Badge from '../components/UI/Badge';
import {
  URGENCY_COLORS,
  STATUS_COLORS,
  TYPE_ICONS,
  SKILL_COLORS
} from '../data/mockData';
import styles from './MapPage.module.css';

// ✅ Map container
const containerStyle = {
  width: '100%',
  height: '520px'
};

// ✅ Default center (fallback)
const defaultCenter = {
  lat: 23.55,
  lng: 87.30
};

function MapPage() {
  const { needs, volunteers } = useApp();

  const [selected, setSelected] = useState(null);
  const [showNeeds, setShowNeeds] = useState(true);
  const [showVols, setShowVols] = useState(true);

  // ✅ Smart center (latest need OR fallback)
  const center =
    needs.length > 0 && needs[0]?.lat
      ? { lat: needs[0].lat, lng: needs[0].lng }
      : defaultCenter;

  return (
    <div>
      {/* 🔹 HEADER */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Live Map View</h1>
          <p className={styles.sub}>
            Real-time locations of needs and volunteers
          </p>
        </div>

        <div className={styles.toggles}>
          <button
            className={`${styles.toggle} ${
              showNeeds ? styles.toggleActive : ''
            }`}
            onClick={() => setShowNeeds(s => !s)}
          >
            🔴 Needs
          </button>

          <button
            className={`${styles.toggle} ${
              showVols ? styles.toggleActive : ''
            }`}
            onClick={() => setShowVols(s => !s)}
          >
            🟢 Volunteers
          </button>
        </div>
      </div>

      {/* 🗺️ GOOGLE MAP */}
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={12}
      >

        {/* 🔴 NEED MARKERS */}
        {showNeeds &&
          needs.map(n =>
            n.lat && n.lng ? (
              <Marker
                key={n.id}
                position={{ lat: n.lat, lng: n.lng }}
                icon="http://maps.google.com/mapfiles/ms/icons/red-dot.png"
                onClick={() => setSelected({ ...n, kind: 'need' })}
              />
            ) : null
          )}

        {/* 🟢 VOLUNTEER MARKERS */}
        {showVols &&
          volunteers.map(v =>
            v.lat && v.lng ? (
              <Marker
                key={v.id}
                position={{ lat: v.lat, lng: v.lng }}
                icon="http://maps.google.com/mapfiles/ms/icons/green-dot.png"
                onClick={() => setSelected({ ...v, kind: 'vol' })}
              />
            ) : null
          )}

        {/* 📦 INFO WINDOW */}
        {selected && selected.lat && selected.lng && (
          <InfoWindow
            position={{ lat: selected.lat, lng: selected.lng }}
            onCloseClick={() => setSelected(null)}
          >
            <div style={{ minWidth: 220 }}>

              {/* 🔴 NEED DETAILS */}
              {selected.kind === 'need' ? (
                <>
                  <div style={{ fontWeight: 'bold', marginBottom: 6 }}>
                    {TYPE_ICONS[selected.category || selected.type]}{' '}
                    {selected.title}
                  </div>

                  <p style={{ margin: '4px 0' }}>
                    📍 {selected.location}
                  </p>

                  <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
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

                  <p>
                    Qty: {selected.qty} {selected.unit}
                  </p>
                </>
              ) : (
                /* 🟢 VOLUNTEER DETAILS */
                <>
                  <div style={{ fontWeight: 'bold', marginBottom: 6 }}>
                    {selected.name}
                  </div>

                  <p>{selected.skill}</p>
                  <p>📍 {selected.location}</p>

                  <Badge
                    text={selected.available ? 'Available' : 'Busy'}
                    color={selected.available ? '#22c55e' : '#ef4444'}
                    size="sm"
                  />

                  <p style={{ marginTop: 6 }}>
                    {selected.distance || 0} km away ·{' '}
                    {selected.tasksCompleted || 0} tasks
                  </p>
                </>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* 📋 SIDE LISTS */}
      <div className={styles.lists}>
        {/* NEED LIST */}
        <div className={styles.listCard}>
          <h3>🔴 Active Needs ({needs.length})</h3>

          {needs.length === 0 && (
            <div className={styles.empty}>No needs available</div>
          )}

          {needs.map(n => (
            <div
              key={n.id}
              className={styles.listItem}
              onClick={() => setSelected({ ...n, kind: 'need' })}
            >
              <span>
                {TYPE_ICONS[n.category || n.type]}
              </span>

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

        {/* VOLUNTEER LIST */}
        <div className={styles.listCard}>
          <h3>🟢 Volunteers ({volunteers.length})</h3>

          {volunteers.length === 0 && (
            <div className={styles.empty}>No volunteers</div>
          )}

          {volunteers.map(v => (
            <div
              key={v.id}
              className={styles.listItem}
              onClick={() => setSelected({ ...v, kind: 'vol' })}
            >
              <div
                className={styles.miniAvatar}
                style={{
                  background: SKILL_COLORS[v.skill] + '33',
                  color: SKILL_COLORS[v.skill]
                }}
              >
                {v.avatar || '?'}
              </div>

              <div className={styles.listInfo}>
                <div className={styles.listName}>{v.name}</div>
                <div className={styles.listMeta}>
                  {v.skill} · {v.distance || 0} km
                </div>
              </div>

              <span className={styles.ratingBadge}>
                ⭐ {v.rating || 0}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MapPage;