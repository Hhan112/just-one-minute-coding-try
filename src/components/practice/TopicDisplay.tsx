import { Card } from '../ui/Card'
import { Topic } from '../../types/practice'

interface TopicDisplayProps {
  topic: Topic
}

export function TopicDisplay({ topic }: TopicDisplayProps) {
  return (
    <Card className="text-center">
      <div className="mb-2">
        <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
          {topic.category}
        </span>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        {topic.title}
      </h2>
      {topic.description && (
        <p className="text-gray-600">{topic.description}</p>
      )}
    </Card>
  )
}