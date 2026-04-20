import React from "react";
import { NavLink } from "react-router-dom"; // ❌ removed useNavigate
import { useApp } from "../../context/AppContext";
import styles from "./Sidebar.module.css";

function Sidebar() {
  const { needs = [], users = [], user } = useApp(); // ❌ removed logout

  // 📊 Pending needs
  const pending = needs.filter((n) => n.status === "Pending").length;

  // 🙋 Approved volunteers
  const volunteers = users.filter(
    (u) => u.role === "Volunteer" && u.status === "approved"
  );

  // ✅ Available volunteers
  const available = volunteers.filter((v) => v.available).length;

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>

        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `${styles.link} ${isActive ? styles.active : ""}`
          }
        >
          📊 Dashboard
        </NavLink>

        <NavLink
          to="/needs"
          className={({ isActive }) =>
            `${styles.link} ${isActive ? styles.active : ""}`
          }
        >
          📋 Needs
          {pending > 0 && <span className={styles.pill}>{pending}</span>}
        </NavLink>

        <NavLink
          to="/volunteers"
          className={({ isActive }) =>
            `${styles.link} ${isActive ? styles.active : ""}`
          }
        >
          🙋 Volunteers
        </NavLink>

        <NavLink
          to="/map"
          className={({ isActive }) =>
            `${styles.link} ${isActive ? styles.active : ""}`
          }
        >
          🗺️ Live Map
        </NavLink>

        <NavLink
          to="/chatbot"
          className={({ isActive }) =>
            `${styles.link} ${isActive ? styles.active : ""}`
          }
        >
          🤖 AI Chat
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `${styles.link} ${isActive ? styles.active : ""}`
          }
        >
          👤 My Profile
        </NavLink>

        {/* 🔐 ADMIN */}
        {user?.role?.toLowerCase() === "admin" && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.active : ""}`
            }
          >
            ⚙️ Admin
          </NavLink>
        )}
      </nav>

      {/* 📊 STATS */}
      <div className={styles.stats}>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>Pending needs</span>
          <span className={styles.statVal} style={{ color: "#f97316" }}>
            {pending}
          </span>
        </div>

        <div className={styles.statRow}>
          <span className={styles.statLabel}>Available vols</span>
          <span className={styles.statVal} style={{ color: "#22c55e" }}>
            {available}
          </span>
        </div>
      </div>

    </aside>
  );
}

export default Sidebar;