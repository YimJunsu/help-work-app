import { useState, useEffect } from 'react'

export interface Memo {
  id: number
  content: string
  createdAt: string
  updatedAt: string
}

/**
 * 메모 데이터를 관리하는 hook
 */
export function useMemos() {
  const [memos, setMemos] = useState<Memo[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadMemos = async () => {
    if (window.electron) {
      setIsLoading(true)
      const memos = await window.electron.ipcRenderer.invoke('memos:getAll')
      setMemos(memos)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMemos()
  }, [])

  const addMemo = async (memo: { content: string }, editingMemo?: Memo | null) => {
    if (window.electron) {
      if (editingMemo) {
        // Update existing memo
        await window.electron.ipcRenderer.invoke('memos:update', editingMemo.id, {
          content: memo.content
        })
      } else {
        // Add new memo
        await window.electron.ipcRenderer.invoke('memos:create', {
          content: memo.content
        })
      }
      await loadMemos()
    }
  }

  const deleteMemo = async (id: number) => {
    if (window.electron) {
      await window.electron.ipcRenderer.invoke('memos:delete', id)
      await loadMemos()
    }
  }

  return {
    memos,
    isLoading,
    addMemo,
    deleteMemo,
    loadMemos
  }
}