import React, { useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { parseNeed } from "../utils/apiClient";
import { geocodeLocation } from "../utils/geo";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Autocomplete } from "@react-google-maps/api";

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
    <div style={{ padding: 20 }}>
      <h2>Describe the Task</h2>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder='e.g. "need 2 doctors and 1 teacher in kolkata"'
        style={{ width: "100%", height: 120 }}
      />

      <br /><br />

      <button onClick={handleAnalyze} disabled={loading}>
        {loading ? "Analyzing..." : "🤖 Analyze"}
      </button>

      {/* 🔍 MULTI TASK PREVIEW */}
      {tasks.map((t, i) => (
        <div key={i} style={{ marginTop: 20, borderTop: "1px solid #333", paddingTop: 10 }}>
          <h3>🧠 Task {i + 1}</h3>

          <p><b>Type:</b> {t.type}</p>
          <p><b>Quantity:</b> {t.qty}</p>
          <p><b>Urgency:</b> {t.urgency}</p>
          <p><b>Volunteers:</b> {t.requiredVolunteers}</p>

          {/* 📍 Editable location with Autocomplete */}
          <div style={{ marginTop: 8 }}>
            <b>Location:</b>

            <Autocomplete
              onLoad={(ref) => (autoRefs.current[i] = ref)}
              onPlaceChanged={() => handlePlaceSelect(i)}
            >
              <input
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
                style={{ width: "100%", padding: 8, marginTop: 6 }}
              />
            </Autocomplete>
          </div>

          {!t.location && (
            <p style={{ color: "orange" }}>
              ⚠️ AI couldn’t detect location—please enter.
            </p>
          )}
        </div>
      ))}

      {tasks.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <button onClick={handleConfirm}>🚀 Confirm & Create All</button>
          <button onClick={() => setTasks([])} style={{ marginLeft: 10 }}>
            ✏️ Rewrite
          </button>
        </div>
      )}
    </div>
  );
}

export default PostNeedPage;