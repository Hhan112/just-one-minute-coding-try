import { useState } from 'react'
import { Button } from '../ui/Button'
import { Type } from 'lucide-react'

interface KeywordInputProps {
  onSave: (text: string) => void
  initialValue?: string
  placeholder?: string
}

export function KeywordInput({ onSave, initialValue = '', placeholder }: KeywordInputProps) {
  const [text, setText] = useState(initialValue)

  const handleSave = () => {
    onSave(text)
  }

  return (
    <div className="space-y-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder || 'Write keywords here...'}
        className="w-full h-32 p-3 border-2 border-gray-300 rounded-lg resize-none focus:border-blue-500 focus:outline-none"
      />
      <Button variant="outline" size="sm" onClick={handleSave}>
        <Type className="w-4 h-4 mr-1" />
        Save Keywords
      </Button>
    </div>
  )
}