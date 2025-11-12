import { useState } from 'react'

/**
 * 드래그앤드롭 기능을 관리하는 hook
 */
export function useDragAndDrop<T extends string | number>() {
  const [draggedItem, setDraggedItem] = useState<T | null>(null)

  const handleDragStart = (e: React.DragEvent, itemId: T) => {
    setDraggedItem(itemId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetId: T, onReorder: (draggedId: T, targetId: T) => void) => {
    e.preventDefault()

    if (!draggedItem || draggedItem === targetId) {
      setDraggedItem(null)
      return
    }

    onReorder(draggedItem, targetId)
    setDraggedItem(null)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
  }

  return {
    draggedItem,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd
  }
}