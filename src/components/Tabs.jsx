// ============================================
// src/components/Tabs.jsx
// Storyboard tab add kiya gaya
// ============================================

import "./Tabs.css";

const TABS = [
  { id: "dashboard",  label: "Dashboard",  icon: "📊" },
  { id: "stories",    label: "Stories",    icon: "📖" },
  { id: "storyboard", label: "Storyboard", icon: "🎬" },
  { id: "review",     label: "Review",     icon: "✅" },
  { id: "publish",    label: "Publish",    icon: "🚀" },
  { id: "analytics",  label: "Analytics",  icon: "📈" },
  { id: "accounts",   label: "Accounts",   icon: "🗄️" },
];

export default function Tabs({ activeTab, onChange }) {
  return (
    <nav className="tabs-bar" role="tablist" aria-label="Main navigation">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
          onClick={() => onChange(tab.id)}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`panel-${tab.id}`}
          id={`tab-${tab.id}`}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
          {activeTab === tab.id && <span className="tab-indicator"></span>}
        </button>
      ))}
    </nav>
  );
}
