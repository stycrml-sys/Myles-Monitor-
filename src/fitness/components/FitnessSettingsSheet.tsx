import { useEffect, useRef, useState } from 'react'
import { Sheet } from '../../components/ui/Sheet'
import { Field, inputClass } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { kgToUnit, unitToKg } from '../insights'
import type { FitnessSettings, WeightUnit } from '../types'

export function FitnessSettingsSheet({
  open,
  onClose,
  settings,
  onSave,
  onExport,
  onImport,
  onClearAll,
}: {
  open: boolean
  onClose: () => void
  settings: FitnessSettings
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

  useEffect(() => {
    if (!open) return
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
      try {
        await onImport(String(reader.result))
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
        <Button onClick={save}>Save</Button>

        <div className="mt-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          <h3 className="mb-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
            Backup &amp; restore
          </h3>
          <p className="mb-3 text-xs text-slate-400">
            All data and photos live only on this device. Export a backup regularly, or before
            switching phones. (Your API key is never included.)
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => void onExport()}>
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
        </div>

        <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
          <Button
            variant="danger"
            className="w-full"
            onClick={() => {
              if (window.confirm('Delete all weights, push-ups and photos on this device? This cannot be undone.')) {
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
