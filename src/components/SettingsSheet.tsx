import { useRef, useState } from 'react'
import { Sheet } from './ui/Sheet'
import { Field, inputClass } from './ui/Field'
import { Button } from './ui/Button'
import type { BabyProfile } from '../types'

export function SettingsSheet({
  open,
  onClose,
  baby,
  onSaveBaby,
  onExport,
  onImport,
  onClearAll,
}: {
  open: boolean
  onClose: () => void
  baby: BabyProfile
  onSaveBaby: (baby: BabyProfile) => void
  onExport: () => void
  onImport: (json: string) => void
  onClearAll: () => void
}) {
  const [name, setName] = useState(baby.name)
  const [birthDate, setBirthDate] = useState(baby.birthDate)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const save = () => {
    onSaveBaby({ name: name.trim() || 'Baby', birthDate })
    onClose()
  }

  const handleImportFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        onImport(String(reader.result))
        onClose()
      } catch {
        window.alert('That backup file could not be read.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <Sheet open={open} title="Settings" onClose={onClose}>
      <div className="flex flex-col gap-4 pb-2">
        <Field label="Baby's name">
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="Date of birth">
          <input
            type="date"
            className={inputClass}
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />
        </Field>
        <Button onClick={save}>Save</Button>

        <div className="mt-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          <h3 className="mb-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
            Backup &amp; restore
          </h3>
          <p className="mb-3 text-xs text-slate-400">
            All data lives only on this device. Export a backup regularly, or before switching
            phones.
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={onExport}>
              Export backup
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => fileInputRef.current?.click()}
            >
              Import backup
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleImportFile(file)
                e.target.value = ''
              }}
            />
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
          <Button
            variant="danger"
            className="w-full"
            onClick={() => {
              if (window.confirm('Delete all tracked entries on this device? This cannot be undone.')) {
                onClearAll()
                onClose()
              }
            }}
          >
            Clear all data
          </Button>
        </div>
      </div>
    </Sheet>
  )
}
