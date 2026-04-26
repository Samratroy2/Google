import React, { useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { parseNeed } from "../utils/apiClient";
import { geocodeLocation } from "../utils/geo";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Autocomplete } from "@react-google-maps/api";
import styles from "./PostNeedPage.module.css";

function PostNeedPage() {
  const { addNeed, currentUser } = useApp();
  const navigate = useNavigate();

  const [text, setText] = useState("");
  const [tasks, setTasks] = useState([]); // array of parsed tasks
  const [loading, setLoading] = useState(false);

  // one ref per row (simple: reuse and read active row index)
  const autoRefs = useRef({}); // { [index]: ref }
  const [coordsMap, setCoordsMap] = useState({}); // { [index]: {lat,lng} }

  // 🤖 Analyze text
  const handleAnalyze = async () => {
    if (!text.trim()) return;

    setLoading(true);
    try {
      const result = await parseNeed(text); // array
      setTasks(result);
      setCoordsMap({});
    } catch (e) {
      toast.error("AI parsing failed");
    }
    setLoading(false);
  };

  // 📍 select place per task
  const handlePlaceSelect = (idx) => {
    const ref = autoRefs.current[idx];
    const place = ref?.getPlace?.();

    if (!place || !place.geometry) {
      toast.error("❌ Select from dropdown");
      return;
    }

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();

    setCoordsMap((m) => ({ ...m, [idx]: { lat, lng } }));

    setTasks((prev) => {
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        location: place.formatted_address || place.name
      };
      return copy;
    });
  };

  // 🚀 Confirm all tasks
  const handleConfirm = async () => {
    if (!tasks.length) return;

    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];

      if (!t.location || t.location.length < 3) {
        toast.error(`⚠️ Enter valid location for Task ${i + 1}`);
        return;
      }

      let coords = coordsMap[i];

      if (!coords) {
        coords = await geocodeLocation(t.location);
      }

      if (!coords) {
        toast.error(`⚠️ Could not find location for Task ${i + 1}`);
        return;
      }

      const payload = {
        ...t,
        lat: coords.lat,
        lng: coords.lng,
        postedBy: currentUser?.email || "anonymous",
        createdAt: new Date(),
        status: "Pending"
      };

      addNeed(payload);
    }

    toast.success("🚀 All tasks created!");
    navigate("/needs");
  };

  return (
  <div className={styles.page}>

    <div className={styles.header}>
      <h2 className={styles.title}>Describe the Task</h2>
      <p className={styles.sub}>Use AI to generate structured needs</p>
    </div>

    <div className={styles.formCard}>

      <textarea
        className={styles.textarea}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder='e.g. "need 2 doctors and 1 teacher in kolkata"'
      />

      <br /><br />

      <button className={`${styles.btn} ${styles.primary}`} onClick={handleAnalyze} disabled={loading}>
        {loading ? "Analyzing..." : "🤖 Analyze"}
      </button>

      {/* 🔍 TASKS */}
      {tasks.map((t, i) => (
        <div key={i} className={styles.taskCard}>

          <div className={styles.taskTitle}>🧠 Task {i + 1}</div>

          <p><b>Type:</b> {t.type}</p>
          <p><b>Quantity:</b> {t.qty}</p>
          <p><b>Urgency:</b> {t.urgency}</p>
          <p><b>Volunteers:</b> {t.requiredVolunteers}</p>

          <div>
            <b>Location:</b>

            <Autocomplete
              onLoad={(ref) => (autoRefs.current[i] = ref)}
              onPlaceChanged={() => handlePlaceSelect(i)}
            >
              <input
                className={styles.input}
                value={t.location || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setTasks((prev) => {
                    const copy = [...prev];
                    copy[i] = { ...copy[i], location: val };
                    return copy;
                  });
                }}
                placeholder="Search or enter location"
              />
            </Autocomplete>
          </div>

          {!t.location && (
            <p style={{ color: "orange" }}>
              ⚠️ Enter location
            </p>
          )}

        </div>
      ))}

      {tasks.length > 0 && (
        <div className={styles.actions}>
          <button className={`${styles.btn} ${styles.primary}`} onClick={handleConfirm}>
            🚀 Confirm & Create All
          </button>

          <button className={`${styles.btn} ${styles.secondary}`} onClick={() => setTasks([])}>
            ✏️ Rewrite
          </button>
        </div>
      )}

    </div>
  </div>
);
}

export default PostNeedPage;