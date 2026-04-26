import React, { useState, useCallback, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { GoogleMap, Marker, OverlayView, HeatmapLayer } from '@react-google-maps/api';
import Badge from '../components/UI/Badge';
import {
  URGENCY_COLORS,
  STATUS_COLORS,
  TYPE_ICONS,
  SKILL_COLORS
} from '../data/mockData';
import {
  generateHeatMapData,
  aggregateNeedsData,
  calculatePriorityScore,
  predictHighRiskAreas,
} from '../utils/aiEngine';
import styles from './MapPage.module.css';

const containerStyle = {
  width:  '100%',
  height: '540px',
};

const defaultCenter = { lat: 23.55, lng: 87.30 };

const MAP_STYLES_DARK = [
  { elementType: 'geometry',           stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.fill',   stylers: [{ color: '#8ec5fc' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a2e' }] },
  { featureType: 'road',               elementType: 'geometry',        stylers: [{ color: '#16213e' }] },
  { featureType: 'road',               elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'water',              elementType: 'geometry',        stylers: [{ color: '#0f3460' }] },
  { featureType: 'administrative',     elementType: 'geometry.stroke', stylers: [{ color: '#334155' }] },
];

const VIEW_MODES = {
  STANDARD:  'standard',
  HEATMAP:   'heatmap',
  CLUSTERS:  'clusters',
  RISK:      'risk',
};

// ─────────────────────────────────────────────
// Helper: group needs into proximity clusters
// predictHighRiskAreas returns flat need-shaped objects;
// the Clusters view needs area-shaped objects with a center.
// ─────────────────────────────────────────────
function buildClusters(needs, radiusKm = 2) {
  const used = new Set();
  const clusters = [];

  needs.forEach((need, i) => {
    if (used.has(i)) return;

    const group = [need];
    used.add(i);

    needs.forEach((other, j) => {
      if (used.has(j)) return;
      const dlat = (need.lat - other.lat) * 111;
      const dlng = (need.lng - other.lng) * 111 * Math.cos((need.lat * Math.PI) / 180);
      if (Math.sqrt(dlat * dlat + dlng * dlng) <= radiusKm) {
        group.push(other);
        used.add(j);
      }
    });

    const center = {
      lat: group.reduce((s, n) => s + n.lat, 0) / group.length,
      lng: group.reduce((s, n) => s + n.lng, 0) / group.length,
    };

    const criticalCount = group.filter(n => n.urgency === 'Critical').length;
    const highCount     = group.filter(n => n.urgency === 'High').length;
    const severityScore = group.reduce((s, n) => s + calculatePriorityScore(n), 0);
    const dominantType  = (() => {
      const freq = {};
      group.forEach(n => { freq[n.type || 'Other'] = (freq[n.type || 'Other'] || 0) + 1; });
      return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Other';
    })();

    const riskLevel =
      criticalCount > 0 || highCount > 1 ? 'High' :
      highCount > 0 || group.length > 2   ? 'Medium' : 'Low';

    clusters.push({
      center,
      needs: group,
      dominantType,
      severityScore,
      riskLevel,
      criticalCount,
    });
  });

  return clusters;
}

// ─────────────────────────────────────────────
// Helper: reshape raw predictHighRiskAreas output
// Raw shape: { lat, lng, riskScore, type, urgency, id }
// Map needs: { center, riskLevel, totalNeeds, criticalCount, needTypes, riskScore }
// ─────────────────────────────────────────────
function reshapeRiskAreas(rawAreas, allNeeds, radiusKm = 2) {
  return rawAreas.map(raw => {
    // Collect all needs near this hotspot
    const nearby = allNeeds.filter(n => {
      if (!n.lat || !n.lng) return false;
      const dlat = (raw.lat - n.lat) * 111;
      const dlng = (raw.lng - n.lng) * 111 * Math.cos((raw.lat * Math.PI) / 180);
      return Math.sqrt(dlat * dlat + dlng * dlng) <= radiusKm;
    });

    const criticalCount = nearby.filter(n => n.urgency === 'Critical').length;
    const needTypes     = [...new Set(nearby.map(n => n.type).filter(Boolean))];

    const riskLevel =
      raw.riskScore >= 60 || criticalCount > 0 ? 'High'   :
      raw.riskScore >= 40                       ? 'Medium' : 'Low';

    return {
      center: { lat: raw.lat, lng: raw.lng },
      riskLevel,
      totalNeeds:   Math.max(nearby.length, 1),
      criticalCount,
      needTypes,
      riskScore:    raw.riskScore,
    };
  });
}

function MapPage() {
  const { needs = [], users = [] } = useApp();

  const [selected,      setSelected]      = useState(null);
  const [showNeeds,     setShowNeeds]     = useState(true);
  const [showVols,      setShowVols]      = useState(true);
  const [viewMode,      setViewMode]      = useState(VIEW_MODES.STANDARD);
  const [filterType,    setFilterType]    = useState('All');
  const [filterUrgency, setFilterUrgency] = useState('All');
  const [showStats,     setShowStats]     = useState(true);
  const mapRef = useRef(null);

  const mapKey = `${needs?.length || 0}-${users?.length || 0}`;

  const volunteers = users.filter(u =>
    (u.role === 'Volunteer' || u.role === 'volunteer') &&
    (u.status === 'approved' || !u.status) &&
    u.lat && u.lng
  );

  const allValidNeeds = needs.filter(n => n.lat && n.lng);

  const validNeeds = allValidNeeds.filter(n => {
    const typeMatch    = filterType    === 'All' || (n.type || '') === filterType;
    const urgencyMatch = filterUrgency === 'All' || n.urgency      === filterUrgency;
    return typeMatch && urgencyMatch;
  });

  // ── AI engine calls ──────────────────────────
  const heatmapData  = generateHeatMapData(validNeeds);
  const rawAnalytics = aggregateNeedsData(needs, users);
  const rawRiskAreas = predictHighRiskAreas(validNeeds);

  // ── Safe analytics with defaults ─────────────
  const safeAnalytics = useMemo(() => {
    const clusters = buildClusters(validNeeds);

    // Completion rate from needs statuses
    const total     = needs.length;
    const completed = needs.filter(n =>
      n.status === 'Completed' || n.status === 'completed'
    ).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // 24-h trend: count needs created in last 24h vs prior 24h
    const now  = Date.now();
    const h24  = 24 * 60 * 60 * 1000;
    const last = needs.filter(n => {
      const t = n.createdAt?.toMillis?.() || n.createdAt || 0;
      return now - t < h24;
    }).length;
    const prior = needs.filter(n => {
      const t = n.createdAt?.toMillis?.() || n.createdAt || 0;
      return now - t >= h24 && now - t < 2 * h24;
    }).length;
    const trendChange = last - prior;

    // Coverage gaps: need types with no matching available volunteer skill
    const volSkills = new Set(
      users
        .filter(u => (u.role === 'Volunteer' || u.role === 'volunteer') && u.available !== false)
        .map(u => (u.skill || '').toLowerCase())
    );
    const pendingTypes = [
      ...new Set(
        needs
          .filter(n => n.status === 'Pending' || n.status === 'pending')
          .map(n => n.type)
          .filter(Boolean)
      ),
    ];
    const coverageGaps = pendingTypes.filter(
      type => ![...volSkills].some(s => s.includes(type.toLowerCase()) || type.toLowerCase().includes(s))
    );

    return {
      ...rawAnalytics,
      areaSeverity:       clusters,
      completionRate,
      trend:              (last > 0 || prior > 0) ? { change: trendChange } : null,
      coverageGaps,
    };
  }, [needs, users, validNeeds, rawAnalytics]);

  // ── Shaped risk areas ─────────────────────────
  const riskAreas = useMemo(
    () => reshapeRiskAreas(rawRiskAreas, validNeeds),
    [rawRiskAreas, validNeeds]
  );

  // ── Map center ────────────────────────────────
  const allPoints = [...validNeeds, ...volunteers];
  const center    = allPoints.length
    ? { lat: allPoints[0].lat, lng: allPoints[0].lng }
    : defaultCenter;

  // ── Heatmap points ────────────────────────────
  const getHeatmapPoints = useCallback(() => {
    if (!window.google) return [];
    return heatmapData.map(p => ({
      location: new window.google.maps.LatLng(p.lat, p.lng),
      weight:   p.weight,
    }));
  }, [heatmapData]);

  // ── Pin color by urgency ──────────────────────
  const urgencyPinColor = (urgency) => {
    if (urgency === 'Critical') return '#ef4444';
    if (urgency === 'High')     return '#f97316';
    if (urgency === 'Medium')   return '#f59e0b';
    return '#22c55e';
  };

  const allTypes     = ['All', ...new Set(allValidNeeds.map(n => n.type).filter(Boolean))];
  const allUrgencies = ['All', 'Critical', 'High', 'Medium', 'Low'];

  return (
    <div className={styles.root}>

      {/* ── HEADER ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>
            <span className={styles.titleIcon}>🗺️</span>
            Intelligence Map
          </h1>
          <p className={styles.sub}>
            Real-time heat map · cluster analysis · risk prediction
          </p>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.viewModes}>
            {Object.entries({
              [VIEW_MODES.STANDARD]: '📍 Standard',
              [VIEW_MODES.HEATMAP]:  '🌡️ Heat Map',
              [VIEW_MODES.CLUSTERS]: '🔵 Clusters',
              [VIEW_MODES.RISK]:     '⚠️ Risk',
            }).map(([mode, label]) => (
              <button
                key={mode}
                className={`${styles.modeBtn} ${viewMode === mode ? styles.modeBtnActive : ''}`}
                onClick={() => setViewMode(mode)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className={styles.toggles}>
            <button
              className={`${styles.toggle} ${showNeeds ? styles.toggleActive : ''}`}
              onClick={() => setShowNeeds(s => !s)}
            >
              🔴 Needs ({validNeeds.length})
            </button>
            <button
              className={`${styles.toggle} ${showVols ? styles.toggleActive : ''}`}
              onClick={() => setShowVols(s => !s)}
            >
              🟢 Volunteers ({volunteers.length})
            </button>
            <button
              className={`${styles.toggle} ${showStats ? styles.statsToggle : ''}`}
              onClick={() => setShowStats(s => !s)}
            >
              📊 Stats
            </button>
          </div>
        </div>
      </div>

      {/* ── ANALYTICS BANNER ── */}
      {safeAnalytics.criticalUnassigned > 0 && (
        <div className={styles.alertBanner}>
          🚨 <strong>{safeAnalytics.criticalUnassigned}</strong> critical/high needs are unassigned —
          immediate action required!
          {safeAnalytics.coverageGaps.length > 0 && (
            <span> · Skill gaps: {safeAnalytics.coverageGaps.join(', ')}</span>
          )}
        </div>
      )}

      {/* ── FILTERS ── */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Type:</span>
          {allTypes.map(t => (
            <button
              key={t}
              className={`${styles.filterChip} ${filterType === t ? styles.filterChipActive : ''}`}
              onClick={() => setFilterType(t)}
            >
              {t}
            </button>
          ))}
        </div>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Urgency:</span>
          {allUrgencies.map(u => (
            <button
              key={u}
              className={`${styles.filterChip} ${filterUrgency === u ? styles.filterChipActive : ''}`}
              onClick={() => setFilterUrgency(u)}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAP ── */}
      <div className={styles.mapWrapper}>
        <GoogleMap
          key={`${mapKey}-${viewMode}-${filterType}-${filterUrgency}`}
          mapContainerStyle={containerStyle}
          center={center}
          zoom={12}
          options={{
            styles:            MAP_STYLES_DARK,
            disableDefaultUI:  false,
            zoomControl:       true,
            mapTypeControl:    true,
            fullscreenControl: true,
          }}
          onLoad={map => { mapRef.current = map; }}
        >

          {/* 🌡️ HEAT MAP LAYER */}
          {viewMode === VIEW_MODES.HEATMAP && window.google?.maps?.visualization && (
            <HeatmapLayer
              data={getHeatmapPoints()}
              options={{
                radius:   30,
                opacity:  0.8,
                gradient: [
                  'rgba(0,255,0,0)',
                  'rgba(0,255,0,1)',
                  'rgba(255,255,0,1)',
                  'rgba(255,165,0,1)',
                  'rgba(255,0,0,1)',
                ],
              }}
            />
          )}

          {/* 🔵 CLUSTER CIRCLES (built from proximity grouping) */}
          {viewMode === VIEW_MODES.CLUSTERS &&
            safeAnalytics.areaSeverity.map((area, i) =>
              area.center?.lat && area.center?.lng ? (
                <OverlayView
                  key={`cluster-${i}`}
                  position={area.center}
                  mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                >
                  <div
                    onClick={() => setSelected({ ...area, kind: 'cluster' })}
                    style={{
                      width:           Math.max(32, Math.min(area.needs.length * 8, 80)),
                      height:          Math.max(32, Math.min(area.needs.length * 8, 80)),
                      borderRadius:    '50%',
                      background:
                        area.riskLevel === 'High'   ? 'rgba(239,68,68,0.5)'   :
                        area.riskLevel === 'Medium' ? 'rgba(249,115,22,0.5)' :
                                                      'rgba(34,197,94,0.5)',
                      border: `2px solid ${
                        area.riskLevel === 'High'   ? '#ef4444' :
                        area.riskLevel === 'Medium' ? '#f97316' : '#22c55e'
                      }`,
                      display:         'flex',
                      alignItems:      'center',
                      justifyContent:  'center',
                      cursor:          'pointer',
                      color:           '#fff',
                      fontWeight:      'bold',
                      fontSize:        12,
                      backdropFilter:  'blur(4px)',
                      transform:       'translate(-50%, -50%)',
                    }}
                  >
                    {area.needs.length}
                  </div>
                </OverlayView>
              ) : null
            )}

          {/* ⚠️ RISK AREAS */}
          {viewMode === VIEW_MODES.RISK &&
            riskAreas.map((area, i) =>
              area.center?.lat && area.center?.lng ? (
                <OverlayView
                  key={`risk-${i}`}
                  position={area.center}
                  mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                >
                  <div
                    onClick={() => setSelected({ ...area, kind: 'risk' })}
                    style={{
                      padding:        '6px 10px',
                      background:
                        area.riskLevel === 'High'   ? 'rgba(239,68,68,0.85)'   :
                        area.riskLevel === 'Medium' ? 'rgba(249,115,22,0.85)' :
                                                      'rgba(34,197,94,0.85)',
                      borderRadius:   8,
                      color:          '#fff',
                      fontSize:       11,
                      fontWeight:     'bold',
                      cursor:         'pointer',
                      whiteSpace:     'nowrap',
                      backdropFilter: 'blur(4px)',
                      transform:      'translate(-50%, -100%)',
                      boxShadow:      '0 4px 12px rgba(0,0,0,0.4)',
                    }}
                  >
                    ⚠️ {area.riskLevel} Risk · {area.totalNeeds} needs
                  </div>
                </OverlayView>
              ) : null
            )}

          {/* 🔴 NEEDS (standard mode) */}
          {showNeeds && viewMode === VIEW_MODES.STANDARD &&
            validNeeds.map(n => {
              const score = calculatePriorityScore(n);
              const size  = 16 + Math.min(score / 10, 8);
              return (
                <OverlayView
                  key={`need-${n.id}`}
                  position={{ lat: n.lat, lng: n.lng }}
                  mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                >
                  <div
                    onClick={() => setSelected({ ...n, kind: 'need' })}
                    title={n.title}
                    style={{
                      width:        size,
                      height:       size,
                      borderRadius: '50%',
                      background:   urgencyPinColor(n.urgency),
                      cursor:       'pointer',
                      border:       '2px solid rgba(255,255,255,0.6)',
                      transform:    'translate(-50%, -50%)',
                      position:     'relative',
                      boxShadow:    `0 0 ${size}px ${urgencyPinColor(n.urgency)}80`,
                    }}
                  >
                    {n.urgency === 'Critical' && (
                      <div style={{
                        position:     'absolute',
                        inset:        -4,
                        borderRadius: '50%',
                        border:       '2px solid #ef4444',
                        animation:    'pulse 1.5s infinite',
                        opacity:      0.6,
                      }} />
                    )}
                  </div>
                </OverlayView>
              );
            })}

          {/* 🟢 VOLUNTEERS */}
          {showVols && volunteers.map(v => (
            <Marker
              key={`vol-${v.uid}`}
              position={{ lat: v.lat, lng: v.lng }}
              icon={
                window.google
                  ? {
                      url:        'https://cdn-icons-png.flaticon.com/512/1946/1946429.png',
                      scaledSize: new window.google.maps.Size(32, 32),
                    }
                  : undefined
              }
              onClick={() =>
                setSelected({
                  ...v,
                  kind: 'vol',
                  name: v.username || v.email?.split('@')[0] || 'Volunteer',
                })
              }
            />
          ))}

          {/* ── POPUP ── */}
          {selected && selected.lat && selected.lng && (
            <OverlayView
              position={{ lat: selected.lat, lng: selected.lng }}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            >
              <div style={{
                minWidth:     240,
                background:   'var(--card)',
                color:        'var(--text)',
                padding:      14,
                borderRadius: 12,
                border:       '1px solid var(--border)',
                boxShadow:    '0 20px 40px rgba(0,0,0,0.5)',
                position:     'relative',
                transform:    'translate(-50%, -120%)',
              }}>
                <div
                  onClick={() => setSelected(null)}
                  style={{ position: 'absolute', top: 8, right: 10, cursor: 'pointer', fontSize: 14, opacity: 0.6 }}
                >✕</div>

                {selected.kind === 'need' && (
                  <>
                    <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 14 }}>
                      {TYPE_ICONS[selected.type] || '📦'} {selected.title}
                    </div>
                    <p style={{ fontSize: 12, marginBottom: 6 }}>📍 {selected.location}</p>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                      <Badge text={selected.urgency} color={URGENCY_COLORS[selected.urgency]} size="sm" />
                      <Badge text={selected.status}  color={STATUS_COLORS[selected.status]}   size="sm" />
                    </div>
                    <p style={{ fontSize: 12 }}>Qty: {selected.qty} {selected.unit}</p>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      Priority Score: <strong>{calculatePriorityScore(selected)}</strong>
                    </div>
                  </>
                )}

                {selected.kind === 'vol' && (
                  <>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>
                      👤 {selected.name || 'Volunteer'}
                    </div>
                    <p style={{ fontSize: 12 }}>{selected.skill || 'No skill'}</p>
                    <p style={{ fontSize: 12 }}>📍 {selected.location}</p>
                    <Badge
                      text={selected.available !== false ? 'Available' : 'Busy'}
                      color={selected.available !== false ? '#22c55e' : '#ef4444'}
                      size="sm"
                    />
                    <p style={{ fontSize: 12, marginTop: 6 }}>
                      ⭐ {selected.rating || 0} · {selected.tasksCompleted || 0} tasks
                    </p>
                  </>
                )}

                {selected.kind === 'cluster' && (
                  <>
                    <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 14 }}>
                      🔵 Area Cluster
                    </div>
                    <p style={{ fontSize: 12 }}>Needs in area: <strong>{selected.needs?.length}</strong></p>
                    <p style={{ fontSize: 12 }}>Dominant type: <strong>{selected.dominantType}</strong></p>
                    <p style={{ fontSize: 12 }}>Severity score: <strong>{selected.severityScore}</strong></p>
                    <Badge
                      text={`${selected.riskLevel} Risk`}
                      color={
                        selected.riskLevel === 'High'   ? '#ef4444' :
                        selected.riskLevel === 'Medium' ? '#f97316' : '#22c55e'
                      }
                      size="sm"
                    />
                  </>
                )}

                {selected.kind === 'risk' && (
                  <>
                    <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 14 }}>
                      ⚠️ Risk Zone
                    </div>
                    <p style={{ fontSize: 12 }}>Risk level: <strong>{selected.riskLevel}</strong></p>
                    <p style={{ fontSize: 12 }}>Total needs: <strong>{selected.totalNeeds}</strong></p>
                    <p style={{ fontSize: 12 }}>Critical count: <strong>{selected.criticalCount}</strong></p>
                    <p style={{ fontSize: 12 }}>
                      Need types: {selected.needTypes?.join(', ') || '—'}
                    </p>
                  </>
                )}
              </div>
            </OverlayView>
          )}

          {/* Popup for cluster/risk (center coords stored in .center, not root) */}
          {selected && !selected.lat && selected.center?.lat && (
            <OverlayView
              position={{ lat: selected.center.lat, lng: selected.center.lng }}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            >
              <div style={{
                minWidth:     240,
                background:   'var(--card)',
                color:        'var(--text)',
                padding:      14,
                borderRadius: 12,
                border:       '1px solid var(--border)',
                boxShadow:    '0 20px 40px rgba(0,0,0,0.5)',
                position:     'relative',
                transform:    'translate(-50%, -120%)',
              }}>
                <div
                  onClick={() => setSelected(null)}
                  style={{ position: 'absolute', top: 8, right: 10, cursor: 'pointer', fontSize: 14, opacity: 0.6 }}
                >✕</div>

                {selected.kind === 'cluster' && (
                  <>
                    <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 14 }}>🔵 Area Cluster</div>
                    <p style={{ fontSize: 12 }}>Needs in area: <strong>{selected.needs?.length}</strong></p>
                    <p style={{ fontSize: 12 }}>Dominant type: <strong>{selected.dominantType}</strong></p>
                    <p style={{ fontSize: 12 }}>Severity score: <strong>{selected.severityScore}</strong></p>
                    <Badge
                      text={`${selected.riskLevel} Risk`}
                      color={selected.riskLevel === 'High' ? '#ef4444' : selected.riskLevel === 'Medium' ? '#f97316' : '#22c55e'}
                      size="sm"
                    />
                  </>
                )}

                {selected.kind === 'risk' && (
                  <>
                    <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 14 }}>⚠️ Risk Zone</div>
                    <p style={{ fontSize: 12 }}>Risk level: <strong>{selected.riskLevel}</strong></p>
                    <p style={{ fontSize: 12 }}>Total needs: <strong>{selected.totalNeeds}</strong></p>
                    <p style={{ fontSize: 12 }}>Critical count: <strong>{selected.criticalCount}</strong></p>
                    <p style={{ fontSize: 12 }}>Need types: {selected.needTypes?.join(', ') || '—'}</p>
                  </>
                )}
              </div>
            </OverlayView>
          )}
        </GoogleMap>

        {/* ── MAP LEGEND ── */}
        <div className={styles.legend}>
          {viewMode === VIEW_MODES.STANDARD && (
            <>
              <div className={styles.legendItem}><span className={styles.dot} style={{ background: '#ef4444' }} /> Critical</div>
              <div className={styles.legendItem}><span className={styles.dot} style={{ background: '#f97316' }} /> High</div>
              <div className={styles.legendItem}><span className={styles.dot} style={{ background: '#f59e0b' }} /> Medium</div>
              <div className={styles.legendItem}><span className={styles.dot} style={{ background: '#22c55e' }} /> Low</div>
            </>
          )}
          {viewMode === VIEW_MODES.HEATMAP && (
            <div className={styles.legendItem}>
              <span style={{
                background:    'linear-gradient(to right,#00ff00,#ffff00,#ff0000)',
                width:         60,
                height:        8,
                borderRadius:  4,
                display:       'inline-block',
                marginRight:   6,
              }} />
              Low → High intensity
            </div>
          )}
          {(viewMode === VIEW_MODES.CLUSTERS || viewMode === VIEW_MODES.RISK) && (
            <>
              <div className={styles.legendItem}><span className={styles.dot} style={{ background: '#ef4444' }} /> High Risk</div>
              <div className={styles.legendItem}><span className={styles.dot} style={{ background: '#f97316' }} /> Medium Risk</div>
              <div className={styles.legendItem}><span className={styles.dot} style={{ background: '#22c55e' }} /> Low Risk</div>
            </>
          )}
        </div>
      </div>

      {/* ── STATS ROW ── */}
      {showStats && (
        <div className={styles.statsRow}>
          <div className={styles.statBox}>
            <div className={styles.statVal}>{validNeeds.length}</div>
            <div className={styles.statLabel}>Active Needs</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statVal} style={{ color: '#ef4444' }}>
              {safeAnalytics.criticalUnassigned}
            </div>
            <div className={styles.statLabel}>Critical Unassigned</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statVal} style={{ color: '#22c55e' }}>
              {safeAnalytics.availableVolunteers}
            </div>
            <div className={styles.statLabel}>Available Volunteers</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statVal} style={{ color: '#6366f1' }}>
              {safeAnalytics.areaSeverity.length}
            </div>
            <div className={styles.statLabel}>Area Clusters</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statVal} style={{ color: '#f59e0b' }}>
              {safeAnalytics.completionRate}%
            </div>
            <div className={styles.statLabel}>Completion Rate</div>
          </div>
          {safeAnalytics.trend && (
            <div className={styles.statBox}>
              <div
                className={styles.statVal}
                style={{ color: safeAnalytics.trend.change > 0 ? '#ef4444' : '#22c55e' }}
              >
                {safeAnalytics.trend.change > 0 ? '↑' : '↓'} {Math.abs(safeAnalytics.trend.change)}
              </div>
              <div className={styles.statLabel}>24h Trend</div>
            </div>
          )}
        </div>
      )}

      {/* ── COVERAGE GAPS ── */}
      {safeAnalytics.coverageGaps.length > 0 && (
        <div className={styles.gapsCard}>
          <h3 className={styles.gapsTitle}>⚠️ Volunteer Skill Gaps Detected</h3>
          <p className={styles.gapsSub}>
            These need types have pending requests but no matching volunteers:
          </p>
          <div className={styles.gapsList}>
            {safeAnalytics.coverageGaps.map(gap => (
              <div key={gap} className={styles.gapChip}>
                {TYPE_ICONS[gap] || '📦'} {gap}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── LISTS ── */}
      <div className={styles.lists}>

        {/* NEED LIST */}
        <div className={styles.listCard}>
          <h3 className={styles.listTitle}>
            🔴 Active Needs
            <span className={styles.listCount}>{validNeeds.length}</span>
          </h3>
          <div className={styles.listScroll}>
            {validNeeds
              .slice()
              .sort((a, b) => calculatePriorityScore(b) - calculatePriorityScore(a))
              .map(n => (
                <div
                  key={n.id}
                  className={styles.listItem}
                  onClick={() => setSelected({ ...n, kind: 'need' })}
                >
                  <span>{TYPE_ICONS[n.type] || '📦'}</span>
                  <div className={styles.listInfo}>
                    <div className={styles.listName}>{n.title}</div>
                    <div className={styles.listMeta}>{n.location}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Badge text={n.urgency} color={URGENCY_COLORS[n.urgency]} size="sm" />
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                      P: {calculatePriorityScore(n)}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* VOLUNTEER LIST */}
        <div className={styles.listCard}>
          <h3 className={styles.listTitle}>
            🟢 Volunteers
            <span className={styles.listCount}>{volunteers.length}</span>
          </h3>
          <div className={styles.listScroll}>
            {volunteers.map(v => (
              <div
                key={v.uid}
                className={styles.listItem}
                onClick={() =>
                  setSelected({
                    ...v,
                    kind: 'vol',
                    name: v.username || v.email?.split('@')[0] || 'Volunteer',
                  })
                }
              >
                <div
                  className={styles.miniAvatar}
                  style={{
                    background: (SKILL_COLORS[v.skill] || '#64748b') + '33',
                    color:      SKILL_COLORS[v.skill] || '#64748b',
                  }}
                >
                  {(v.username || v.email || '?')[0].toUpperCase()}
                </div>
                <div className={styles.listInfo}>
                  <div className={styles.listName}>
                    {v.username || v.email?.split('@')[0] || 'Volunteer'}
                  </div>
                  <div className={styles.listMeta}>
                    {v.skill || 'No skill'} · {v.location || 'Unknown'}
                  </div>
                </div>
                <span className={styles.ratingBadge}>⭐ {v.rating || 0}</span>
              </div>
            ))}
          </div>
        </div>

        {/* HIGH RISK AREAS */}
        <div className={styles.listCard}>
          <h3 className={styles.listTitle}>
            ⚠️ High Risk Areas
            <span className={styles.listCount}>{riskAreas.length}</span>
          </h3>
          <div className={styles.listScroll}>
            {riskAreas.slice(0, 8).map((area, i) => (
              <div
                key={i}
                className={styles.listItem}
                onClick={() => setSelected({ ...area, kind: 'risk' })}
              >
                <div style={{
                  background:   area.riskLevel === 'High'   ? '#ef444430' :
                                area.riskLevel === 'Medium' ? '#f9731630' : '#22c55e30',
                  color:        area.riskLevel === 'High'   ? '#ef4444'   :
                                area.riskLevel === 'Medium' ? '#f97316'   : '#22c55e',
                  padding:      '4px 8px',
                  borderRadius: 6,
                  fontSize:     11,
                  fontWeight:   700,
                }}>
                  {area.riskLevel}
                </div>
                <div className={styles.listInfo}>
                  <div className={styles.listName}>{area.needTypes?.slice(0, 2).join(', ') || '—'}</div>
                  <div className={styles.listMeta}>
                    {area.totalNeeds} needs · {area.criticalCount} critical
                  </div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
                  Score: {area.riskScore}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PULSE ANIMATION ── */}
      <style>{`
        @keyframes pulse {
          0%   { transform: scale(1);   opacity: 0.6; }
          70%  { transform: scale(2.5); opacity: 0; }
          100% { transform: scale(1);   opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default MapPage;