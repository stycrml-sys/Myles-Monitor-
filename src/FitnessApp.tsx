import { useState } from 'react'
import { FitnessHeader, FitnessNavBar } from './components/Chrome'
import { FitnessSettingsSheet } from './components/FitnessSettingsSheet'
import { ConfirmProvider } from './components/Confirm'
import { TodayScreen } from './screens/TodayScreen'
import { PhotosScreen } from './screens/PhotosScreen'
import { TrendsScreen } from './screens/TrendsScreen'
import { useFitnessData } from './storage'
import type { FitnessTab } from './types'

export default function FitnessApp() {
  const [tab, setTab] = useState<FitnessTab>('today')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const {
    platform,
    data,
    setSettings,
    saveWeight,
    deleteWeight,
    savePushups,
    deletePushups,
    saveCheckin,
    deleteCheckin,
    exportData,
    importData,
    clearAll,
  } = useFitnessData()

  if (!platform || !data) {
    return (
      <div className="flex min-h-svh flex-1 items-center justify-center bg-[#f5f4fb] text-sm text-slate-400 dark:bg-[#131120]">
        Loading your log…
      </div>
    )
  }

  return (
    <ConfirmProvider>
      <div className="mx-auto flex min-h-svh w-full max-w-lg flex-1 flex-col bg-[#f5f4fb] dark:bg-[#131120]">
        <FitnessHeader name={data.settings.name} onSettings={() => setSettingsOpen(true)} />

        <main className="flex-1 pb-4">
          {tab === 'today' && (
            <TodayScreen
              data={data}
              onSaveWeight={saveWeight}
              onDeleteWeight={deleteWeight}
              onSavePushups={savePushups}
              onDeletePushups={deletePushups}
            />
          )}
          {tab === 'photos' && (
            <PhotosScreen
              data={data}
              platform={platform}
              onSave={saveCheckin}
              onDelete={deleteCheckin}
              onOpenSettings={() => setSettingsOpen(true)}
            />
          )}
          {tab === 'trends' && <TrendsScreen data={data} />}
        </main>

        <FitnessNavBar active={tab} onChange={setTab} />

        <FitnessSettingsSheet
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          settings={data.settings}
          platform={platform}
          onSave={setSettings}
          onExport={exportData}
          onImport={importData}
          onClearAll={clearAll}
        />
      </div>
    </ConfirmProvider>
  )
}
