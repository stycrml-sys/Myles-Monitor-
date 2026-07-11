import { useState } from 'react'
import { Header } from './components/Header'
import { NavBar } from './components/NavBar'
import { SettingsSheet } from './components/SettingsSheet'
import { FeedScreen } from './screens/FeedScreen'
import { ToiletingScreen } from './screens/ToiletingScreen'
import { SleepScreen } from './screens/SleepScreen'
import { TrendsScreen } from './screens/TrendsScreen'
import { useAppData } from './storage'
import type { TabKey } from './types'

function App() {
  const [tab, setTab] = useState<TabKey>('feed')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const {
    data,
    setBaby,
    addFeed,
    updateFeed,
    deleteFeed,
    addToileting,
    updateToileting,
    deleteToileting,
    addSleep,
    updateSleep,
    deleteSleep,
    exportData,
    importData,
    clearAll,
  } = useAppData()

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-lg flex-1 flex-col bg-[#f5f4fb] dark:bg-[#131120]">
      <Header baby={data.baby} onSettings={() => setSettingsOpen(true)} />

      <main className="flex-1 pb-4">
        {tab === 'feed' && (
          <FeedScreen
            feeds={data.feeds}
            onAdd={addFeed}
            onUpdate={updateFeed}
            onDelete={deleteFeed}
          />
        )}
        {tab === 'toileting' && (
          <ToiletingScreen
            entries={data.toileting}
            onAdd={addToileting}
            onUpdate={updateToileting}
            onDelete={deleteToileting}
          />
        )}
        {tab === 'sleep' && (
          <SleepScreen
            entries={data.sleep}
            onAdd={addSleep}
            onUpdate={updateSleep}
            onDelete={deleteSleep}
          />
        )}
        {tab === 'trends' && (
          <TrendsScreen feeds={data.feeds} toileting={data.toileting} sleep={data.sleep} />
        )}
      </main>

      <NavBar active={tab} onChange={setTab} />

      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        baby={data.baby}
        onSaveBaby={setBaby}
        onExport={exportData}
        onImport={importData}
        onClearAll={clearAll}
      />
    </div>
  )
}

export default App
