// ============================================
// src/App.jsx — v1.0.0
// Main app shell — Google Sheets backend, OAuth auth
// ============================================

import { useState, lazy, Suspense } from 'react';
import { Settings } from 'lucide-react';
import Header from "./components/Header";
import Tabs from "./components/Tabs";
const Dashboard = lazy(() => import("./components/Dashboard/Dashboard"));
const StoryTable = lazy(() => import("./components/Stories/StoryTable"));
const Storyboard = lazy(() => import("./components/Storyboard/Storyboard"));
const ReviewPanel = lazy(() => import("./components/Review/ReviewCard"));
const PublishForm = lazy(() => import("./components/Publish/PublishForm"));
const Analytics = lazy(() => import("./components/Analytics/Analytics"));
import SettingsDrawer from "./components/SettingsDrawer";
import { useStories } from "./hooks/useStories";
import { useAuth } from "./hooks/useAuth";
import "./App.css";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);

  const { isAuthenticated, signIn, isLoading: authLoading, authError } = useAuth();

  const {
    stories,
    filteredStories,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    pipelineCounts,
    kpis,
    editStory,
    moveToStoryboard,
    moveToReview,
    approveStory,
    scheduleStory,
    publishStory,
    refresh,
    statuses,
  } = useStories();

  const handlePushToStoryboard = async (story) => {
    if (story.dashStatus !== "storyboard") {
      await moveToStoryboard(story.id);
    }
    // Update local reference to avoid stale prop reads in Storyboard before refetch completes
    setSelectedStory({ ...story, dashStatus: "storyboard" });
    setActiveTab("storyboard");
  };

  if (!isAuthenticated) {
    return (
      <div className="login-screen" style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
        <h1 className="logo-text" style={{ fontSize: '2rem' }}>BRIGHT LITTLE STORIES</h1>
        <p>Production Dashboard Authentication</p>
        <button className="btn btn-primary" onClick={signIn} disabled={authLoading}>
          {authLoading ? 'Signing In...' : 'Sign in with Google'}
        </button>
        {authError && <p className="text-error">{authError}</p>}
      </div>
    );
  }

  return (
    <div className="app">
      <h1 className="sr-only">Bright Little Stories Dashboard</h1>

      <Header
        onRefresh={refresh}
        onToggleSettings={() => setSettingsOpen((prev) => !prev)}
      />

      <Tabs activeTab={activeTab} onChange={setActiveTab} />

      <main className="app-main">
        {loading && (
          <div className="loading-state">
            <div className="loader"></div>
            <p>Loading stories from Sheet…</p>
          </div>
        )}

        {error && !loading && (
          <div className="error-state panel">
            <p>⚠️ {error}</p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button className="btn btn-sm btn-primary" onClick={refresh}>
                🔄 Retry
              </button>
              <button className="btn btn-sm btn-icon" onClick={() => setSettingsOpen(true)} aria-label="Open settings" id="btn-settings">
                <Settings size={18} />
              </button>
            </div>
          </div>
        )}

        {!loading && !error && (
          <Suspense fallback={<div className="loading-state"><div className="loader"></div><p>Loading tab...</p></div>}>
            
            {activeTab === "dashboard" && (
              <Dashboard stories={stories} kpis={kpis} pipelineCounts={pipelineCounts} />
            )}

            {activeTab === "stories" && (
              <StoryTable
                stories={filteredStories}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                filterStatus={filterStatus}
                onFilterChange={setFilterStatus}
                statuses={statuses}
                onOpenStoryboard={handlePushToStoryboard}
              />
            )}

            {activeTab === "storyboard" && (
              <Storyboard
                story={selectedStory || stories.find(s => s.dashStatus === "storyboard")}
                stories={stories}
                onSelectStory={setSelectedStory}
                onEdit={editStory}
                onMoveToReview={moveToReview}
              />
            )}

            {activeTab === "review" && (
              <ReviewPanel
                stories={stories}
                onApprove={approveStory}
                onEdit={editStory}
                onGoToPublish={() => setActiveTab("publish")}
              />
            )}

            {activeTab === "publish" && (
              <PublishForm
                stories={stories}
                onSchedule={scheduleStory}
                onPublish={publishStory}
                onEdit={editStory}
              />
            )}

            {activeTab === "analytics" && (
              <Analytics stories={stories} pipelineCounts={pipelineCounts} />
            )}

          </Suspense>
        )}
      </main>

      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
