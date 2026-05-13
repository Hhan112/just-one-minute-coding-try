import { Topic } from '../types/practice'

export const topics: Topic[] = [
  // Person 人物类
  {
    id: 'p1',
    category: 'person',
    title: 'Describe a person who has greatly influenced you',
    description: 'Who this person is, how you know them, and why they inspire you',
  },
  {
    id: 'p2',
    category: 'person',
    title: 'Describe a memorable conversation you had',
    description: 'Who you spoke with, where it happened, and what made it memorable',
  },
  {
    id: 'p3',
    category: 'person',
    title: 'Describe a teacher who impacted your learning',
    description: 'What subject they taught, what made them special, and how they helped you',
  },
  // Place 地点类
  {
    id: 'l1',
    category: 'place',
    title: 'Describe a city you would recommend others to visit',
    description: 'Where it is, what makes it special, and what visitors can do there',
  },
  {
    id: 'l2',
    category: 'place',
    title: 'Describe a public place that you visit frequently',
    description: 'What place it is, where it is located, and why you go there often',
  },
  {
    id: 'l3',
    category: 'place',
    title: 'Describe a park or garden that you enjoy',
    description: 'Where it is, what it looks like, and what activities you do there',
  },
  // Event 事件类
  {
    id: 'e1',
    category: 'event',
    title: 'Describe a celebration you attended',
    description: 'What was being celebrated, where it took place, and how you felt',
  },
  {
    id: 'e2',
    category: 'event',
    title: 'Describe a cultural event you experienced',
    description: 'What the event was, where you attended, and what you learned',
  },
  {
    id: 'e3',
    category: 'event',
    title: 'Describe a memorable trip or excursion',
    description: 'Where you went, what you did, and why it was memorable',
  },
  // Object 物品类
  {
    id: 'o1',
    category: 'object',
    title: 'Describe an object that is important to you',
    description: 'What it is, where you got it, and why it is meaningful',
  },
  {
    id: 'o2',
    category: 'object',
    title: 'Describe a book that you have read more than once',
    description: 'What it is about, why you reread it, and what you gained from it',
  },
  {
    id: 'o3',
    category: 'object',
    title: 'Describe a piece of technology you use daily',
    description: 'What it is, how it helps you, and how it has changed your life',
  },
  // Experience 经历类
  {
    id: 'x1',
    category: 'experience',
    title: 'Describe a challenge you overcame',
    description: 'What the challenge was, how you addressed it, and what you learned',
  },
  {
    id: 'x2',
    category: 'experience',
    title: 'Describe a skill you learned quickly',
    description: 'What the skill was, how you learned it, and how you felt about it',
  },
  {
    id: 'x3',
    category: 'experience',
    title: 'Describe a memorable meal you had',
    description: 'Where you were, what you ate, and why it was memorable',
  },
  {
    id: 'x4',
    category: 'experience',
    title: 'Describe an experience that changed your perspective',
    description: 'What happened, how it affected you, and what you realized',
  },
  {
    id: 'x5',
    category: 'experience',
    title: 'Describe a time you helped someone',
    description: 'Who you helped, what you did, and how it made you feel',
  },
  {
    id: 'x6',
    category: 'experience',
    title: 'Describe your ideal vacation',
    description: 'Where you would go, what you would do, and who you would bring',
  },
]

export function getRandomTopic(): Topic {
  return topics[Math.floor(Math.random() * topics.length)]
}

export function getTopicsByCategory(category: Topic['category']): Topic[] {
  return topics.filter(t => t.category === category)
}