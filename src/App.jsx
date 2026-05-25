// ============================================
// src/App.jsx
// Main app — Supabase removed, Sheet connected
// New tabs: Storyboard added
// ============================================

import { useState } from "react";
import Header from "./components/Header";
import Tabs from "./components/Tabs";
import Dashboard from "./components/Dashboard/Dashboard";
import StoryTable from "./components/Stories/StoryTable";
import Storyboard from "./components/Storyboard/Storyboard";
import UploadZone from "./components/Upload/UploadZone";
import ReviewPanel from "./components/Review/ReviewCard";
import PublishForm from "./components/Publish/PublishForm";
import Analytics from "./components/Analytics/Analytics";
import SettingsDrawer from "./components/SettingsDrawer";
import { useStories } from "./hooks/useStories";
import "./App.css";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null); // Storyboard ke liye

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
    moveToUploaded,
    moveToReview,
    approveStory,
    scheduleStory,
    publishStory,
    refresh,
    statuses,
  } = useStories();

  // Story click → Storyboard tab kholo
  const handleOpenStoryboard = (story) => {
    setSelectedStory(story);
    setActiveTab("storyboard");
  };

  // Storyboard se Upload tab pe jao
  const handleGoToUpload = (story) => {
    setSelectedStory(story);
    setActiveTab("upload");
  };

  return (
    <div className="app">
      <h1 className="sr-only">Bright Little Stories Dashboard</h1>

      <Header
        onRefresh={refresh}
        onToggleSettings={() => setSettingsOpen((prev) => !prev)}
      />

      <Tabs activeTab={activeTab} onChange={setActiveTab} />

      <main className="app-main">
        {/* Loading State */}
        {loading && (
          <div className="loading-state">
            <div className="loader"></div>
            <p>Sheet se data load ho raha hai…</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="error-state panel">
            <p>⚠️ {error}</p>
            <button className="btn btn-sm" onClick={refresh}>
              Retry
            </button>
          </div>
        )}

        {/* Main Content */}
        {!loading && !error && (
          <>
            {/* TAB: Dashboard */}
            {activeTab === "dashboard" && (
              <Dashboard
                stories={stories}
                kpis={kpis}
                pipelineCounts={pipelineCounts}
              />
            )}

            {/* TAB: Stories Table */}
            {activeTab === "stories" && (
              <StoryTable
                stories={filteredStories}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                filterStatus={filterStatus}
                onFilterChange={setFilterStatus}
                statuses={statuses}
                onOpenStoryboard={handleOpenStoryboard}
              />
            )}

            {/* TAB: Storyboard — Story detail + status move */}
            {activeTab === "storyboard" && (
              <Storyboard
                story={selectedStory}
                stories={stories}
                onSelectStory={setSelectedStory}
                onMoveToStoryboard={moveToStoryboard}
                onGoToUpload={handleGoToUpload}
                onEdit={editStory}
              />
            )}

            {/* TAB: Upload — Drive links */}
            {activeTab === "upload" && (
              <UploadZone
                story={selectedStory}
                stories={stories}
                onSelectStory={setSelectedStory}
                onUpdate={editStory}
                onMoveToUploaded={moveToUploaded}
                onMoveToReview={moveToReview}
              />
            )}

            {/* TAB: Review */}
            {activeTab === "review" && (
              <ReviewPanel
                stories={stories}
                onApprove={approveStory}
                onEdit={editStory}
                onGoToPublish={() => setActiveTab("publish")}
              />
            )}

            {/* TAB: Publish */}
            {activeTab === "publish" && (
              <PublishForm
                stories={stories}
                onSchedule={scheduleStory}
                onPublish={publishStory}
                onEdit={editStory}
              />
            )}

            {/* TAB: Analytics */}
            {activeTab === "analytics" && (
              <Analytics stories={stories} pipelineCounts={pipelineCounts} />
            )}
          </>
        )}
      </main>

      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
