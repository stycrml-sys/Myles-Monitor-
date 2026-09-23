import { useCallback, useRef, useState, type ReactNode } from 'react'
import { Sheet } from './ui/Sheet'
import { Button } from './ui/Button'
import { ConfirmContext, type ConfirmFn } from './useConfirm'

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ message: string; action: string } | null>(null)
  const resolver = useRef<((ok: boolean) => void) | null>(null)

  const confirm = useCallback<ConfirmFn>((message, action = 'Delete') => {
    resolver.current?.(false)
    setState({ message, action })
    return new Promise((resolve) => {
      resolver.current = resolve
    })
  }, [])

  const close = (ok: boolean) => {
    resolver.current?.(ok)
    resolver.current = null
    setState(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Sheet open={state !== null} title="Are you sure?" onClose={() => close(false)}>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">{state?.message}</p>
        <div className="flex gap-2 pb-2">
          <Button variant="secondary" className="flex-1" onClick={() => close(false)}>
            Cancel
          </Button>
          <Button variant="danger" className="flex-1" onClick={() => close(true)}>
            {state?.action}
          </Button>
        </div>
      </Sheet>
    </ConfirmContext.Provider>
  )
}
