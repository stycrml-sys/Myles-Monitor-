import { createContext, useContext } from 'react'

// In-page confirmation, since window.confirm() is unavailable inside a
// claude.ai artifact (it returns false without showing anything).

export type ConfirmFn = (message: string, action?: string) => Promise<boolean>

export const ConfirmContext = createContext<ConfirmFn>(async () => false)

export function useConfirm(): ConfirmFn {
  return useContext(ConfirmContext)
}
