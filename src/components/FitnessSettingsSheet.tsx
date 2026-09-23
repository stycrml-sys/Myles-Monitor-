import { useEffect, useRef, useState } from 'react'
import { Sheet } from './ui/Sheet'
import { Field, inputClass } from './ui/Field'
import { Button } from './ui/Button'
import { SegmentedControl } from './ui/SegmentedControl'
import { kgToUnit, unitToKg } from '../insights'
import type { FitnessSettings, WeightUnit } from '../types'
import type { Platform } from '../platform'
import { useConfirm } from './useConfirm'

export function FitnessSettingsSheet({
  open,
  onClose,
  settings,
  platform,
  onSave,
  onExport,
  onImport,
  onClearAll,
}: {
  open: boolean
  onClose: () => void
  settings: FitnessSettings
  platform: Platform
  onSave: (s: FitnessSettings) => void
  onExport: () => Promise<void>
  onImport: (json: string) => Promise<void>
  onClearAll: () => void
}) {
  const [name, setName] = useState(settings.name)
  const [unit, setUnit] = useState<WeightUnit>(settings.unit)
  const [goal, setGoal] = useState('')
  const [pushGoal, setPushGoal] = useState('')
  const [apiKey, setApiKey] = useState(settings.apiKey)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const confirm = useConfirm()
  const [backupError, setBackupError] = useState<string | null>(null)
  const [backupBusy, setBackupBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setBackupError(null)
    setName(settings.name)
    setUnit(settings.unit)
    setGoal(
      settings.goalWeightKg !== null
        ? String(Math.round(kgToUnit(settings.goalWeightKg, settings.unit) * 10) / 10)
        : '',
    )
    setPushGoal(settings.pushupGoal ? String(settings.pushupGoal) : '')
    setApiKey(settings.apiKey)
  }, [open, settings])

  const changeUnit = (next: WeightUnit) => {
    const v = parseFloat(goal)
    if (Number.isFinite(v)) setGoal(String(Math.round(kgToUnit(unitToKg(v, unit), next) * 10) / 10))
    setUnit(next)
  }

  const save = () => {
    const g = parseFloat(goal)
    const p = parseInt(pushGoal, 10)
    onSave({
      name: name.trim(),
      unit,
      goalWeightKg: Number.isFinite(g) && g > 0 ? unitToKg(g, unit) : null,
      pushupGoal: p > 0 ? p : null,
      apiKey: apiKey.trim(),
    })
    onClose()
  }

  const handleImportFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = async () => {
      setBackupBusy(true)
      setBackupError(null)
      try {
        await onImport(String(reader.result))
        onClose()
      } catch {
        setBackupError('That backup file could not be read.')
      } finally {
        setBackupBusy(false)
      }
    }
    reader.readAsText(file)
  }

  return (
    <Sheet open={open} title="Settings" onClose={onClose}>
      <div className="flex flex-col gap-4 pb-2">
        <Field label="Your name (optional)">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Weight unit">
          <SegmentedControl
            options={[
              { value: 'kg', label: 'kg' },
              { value: 'lb', label: 'lb' },
            ]}
            value={unit}
            onChange={changeUnit}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={`Goal weight (${unit})`}>
            <input
              type="number"
              inputMode="decimal"
              className={inputClass}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Optional"
            />
          </Field>
          <Field label="Push-ups / day goal">
            <input
              type="number"
              inputMode="numeric"
              className={inputClass}
              value={pushGoal}
              onChange={(e) => setPushGoal(e.target.value)}
              placeholder="Optional"
            />
          </Field>
        </div>
        {platform.kind === 'web' && (
          <>
            <Field label="Claude API key (for photo analysis)">
              <input
                type="password"
                autoComplete="off"
                className={inputClass}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-…"
              />
            </Field>
            <p className="-mt-2 text-xs text-slate-400">
              Optional. Stored only on this device and sent only to Anthropic when you tap “Analyse”.
              Get one at console.anthropic.com. Each analysis costs a few cents.
            </p>
          </>
        )}
        <Button onClick={save}>Save</Button>

        <div className="mt-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          <h3 className="mb-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
            Backup &amp; restore
          </h3>
          <p className="mb-3 text-xs text-slate-400">
            {platform.storageNote} Export a backup to keep your own copy
            {platform.kind === 'web' ? ' (your API key is never included)' : ''}.
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              disabled={backupBusy}
              onClick={async () => {
                setBackupBusy(true)
                setBackupError(null)
                try {
                  await onExport()
                } catch (e) {
                  setBackupError(e instanceof Error ? e.message : "Couldn't export.")
                } finally {
                  setBackupBusy(false)
                }
              }}
            >
              Export backup
            </Button>
            <Button variant="secondary" className="flex-1" onClick={() => fileInputRef.current?.click()}>
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
          {backupBusy && <p className="mt-2 text-xs text-slate-400">Working…</p>}
          {backupError && <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{backupError}</p>}
        </div>

        <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
          <Button
            variant="danger"
            className="w-full"
            onClick={async () => {
              if (await confirm('Delete all weights, push-ups and photos? This cannot be undone.', 'Delete everything')) {
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
