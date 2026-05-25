import { useState } from 'react';
import Header from './components/Header';
import Tabs from './components/Tabs';
import Dashboard from './components/Dashboard/Dashboard';
import StoryTable from './components/Stories/StoryTable';
import UploadZone from './components/Upload/UploadZone';
import ReviewPanel from './components/Review/ReviewCard';
import PublishForm from './components/Publish/PublishForm';
import Analytics from './components/Analytics/Analytics';
import SettingsDrawer from './components/SettingsDrawer';
import SheetImportModal from './components/SheetImport/SheetImportModal';
import { useStories } from './hooks/useStories';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newAge, setNewAge] = useState('2-6');

  const {
    stories, filteredStories, loading, error,
    searchQuery, setSearchQuery, filterStatus, setFilterStatus,
    pipelineCounts, kpis, addStory, addStoriesBulk, editStory, removeStory,
    refresh, statuses,
  } = useStories();

  const handleAddStory = async () => {
    if (!newTitle.trim()) return;
    await addStory({ title: newTitle, category: newCategory, ageGroup: newAge });
    setNewTitle('');
    setNewCategory('');
    setNewAge('2-6');
    setAddModalOpen(false);
  };

  const handleStoryUpdate = (id, updates) => {
    editStory(id, updates);
  };

  const handleApprove = (story) => {
    if (story.status === 'complete') editStory(story.id, { status: 'review' });
    else if (story.status === 'review') editStory(story.id, { status: 'approved' });
  };

  const handleReject = (story) => {
    editStory(story.id, { status: 'draft' });
  };

  const handlePublishClick = () => {
    setActiveTab('publish');
  };

  const handlePublishStory = (story, publishData) => {
    editStory(story.id, publishData);
  };

  return (
    <div className="app">
      <h1 className="sr-only">Bright Little Stories Dashboard</h1>

      <Header
        onRefresh={refresh}
        onAddStory={() => setAddModalOpen(true)}
        onImportSheet={() => setImportModalOpen(true)}
        onToggleSettings={() => setSettingsOpen(prev => !prev)}
      />

      <Tabs activeTab={activeTab} onChange={setActiveTab} />

      <main className="app-main">
        {loading && (
          <div className="loading-state">
            <div className="loader"></div>
            <p>Loading stories…</p>
          </div>
        )}

        {error && (
          <div className="error-state panel">
            <p>⚠️ {error}</p>
            <button className="btn btn-sm" onClick={refresh}>Retry</button>
          </div>
        )}

        {!loading && !error && (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard stories={stories} kpis={kpis} pipelineCounts={pipelineCounts} />
            )}
            {activeTab === 'stories' && (
              <StoryTable
                stories={filteredStories}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                filterStatus={filterStatus}
                onFilterChange={setFilterStatus}
                statuses={statuses}
                onEdit={(story) => console.log('Edit story:', story)}
                onRemove={removeStory}
              />
            )}
            {activeTab === 'upload' && (
              <UploadZone stories={stories} onStoryUpdate={handleStoryUpdate} />
            )}
            {activeTab === 'review' && (
              <ReviewPanel
                stories={stories}
                onApprove={handleApprove}
                onReject={handleReject}
                onPublish={handlePublishClick}
              />
            )}
            {activeTab === 'publish' && (
              <PublishForm 
                stories={stories} 
                onPublish={handlePublishStory} 
              />
            )}
            {activeTab === 'analytics' && (
              <Analytics stories={stories} />
            )}
          </>
        )}
      </main>

      {/* Add Story Modal */}
      {addModalOpen && (
        <>
          <div className="modal-overlay" onClick={() => setAddModalOpen(false)}></div>
          <div className="modal" role="dialog" aria-label="Add new story" id="add-story-modal">
            <h2 className="modal-title">📝 New Story</h2>
            <div className="form-group">
              <label className="form-label" htmlFor="new-story-title">Title</label>
              <input
                className="input"
                id="new-story-title"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Enter story title…"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="new-story-category">Category</label>
              <input
                className="input"
                id="new-story-category"
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                placeholder="e.g. Adventure, Bedtime, Fantasy…"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="new-story-age">Age Group</label>
              <select
                className="input"
                id="new-story-age"
                value={newAge}
                onChange={e => setNewAge(e.target.value)}
              >
                <option value="1-3">1-3 years</option>
                <option value="2-4">2-4 years</option>
                <option value="2-6">2-6 years</option>
                <option value="3-5">3-5 years</option>
                <option value="3-6">3-6 years</option>
                <option value="4-6">4-6 years</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-sm" onClick={() => setAddModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleAddStory} disabled={!newTitle.trim()}>
                Create Story
              </button>
            </div>
          </div>
        </>
      )}

      {/* Sheet Import Modal */}
      {importModalOpen && (
        <SheetImportModal 
          onImport={addStoriesBulk} 
          onClose={() => setImportModalOpen(false)} 
        />
      )}

      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
