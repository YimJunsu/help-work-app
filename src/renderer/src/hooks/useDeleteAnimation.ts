import { useState } from 'react'

/**
 * 삭제 애니메이션을 관리하는 hook
 */
export function useDeleteAnimation<T extends string | number>() {
  const [deletingItems, setDeletingItems] = useState<Set<T>>(new Set())

  const deleteWithAnimation = (id: T, onDelete: (id: T) => void, delay: number = 300) => {
    setDeletingItems(prev => new Set([...prev, id]))
    setTimeout(() => {
      onDelete(id)
      setDeletingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }, delay)
  }

  const deleteMultipleWithAnimation = (ids: T[], onDelete: () => void, delay: number = 300) => {
    setDeletingItems(new Set(ids))
    setTimeout(() => {
      onDelete()
      setDeletingItems(new Set())
    }, delay)
  }

  return {
    deletingItems,
    deleteWithAnimation,
    deleteMultipleWithAnimation
  }
}