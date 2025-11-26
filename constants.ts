import { SessionReport } from './types';

// Initial mock report to show before a live session is recorded
export const MOCK_REPORT: SessionReport = {
  id: 'demo-1',
  date: new Date().toLocaleDateString(),
  transcript: "Teacher: Sarah has shown great improvement in mathematics this semester. She is participating more in class. \nParent: That's good to hear. We've been working on fractions at home. How is her reading comprehension?\nTeacher: Her reading is steady, though she sometimes rushes through the comprehension questions. I'd suggest slowing down.",
  summary: "Sarah shows strong improvement in Math, particularly with participation. Reading is steady but requires focus on comprehension speed.",
  metrics: [
    { name: 'Academic Progress', score: 85, max: 100, description: 'Overall content mastery' },
    { name: 'Class Participation', score: 92, max: 100, description: 'Engagement in discussions' },
    { name: 'Social Skills', score: 88, max: 100, description: 'Interaction with peers' },
    { name: 'Focus', score: 75, max: 100, description: 'Attention span during lessons' },
  ],
  swot: {
    strengths: ['Mathematics participation', 'Homework consistency', 'Peer collaboration'],
    weaknesses: ['Reading comprehension speed', 'Rushing assignments'],
    opportunities: ['Advanced math club', 'Reading focus groups'],
    threats: ['Distraction during long reading blocks'],
  },
  topics: ['Mathematics', 'Reading', 'Behavior', 'Homework'],
};

export const SYSTEM_INSTRUCTION_LIVE = `You are Swotify, an intelligent assistant for parent-teacher meetings. 
Your goal is to listen to the conversation, identify key educational metrics, and provide a helpful presence. 
Be professional, encouraging, and concise in your spoken responses.`;

export const SYSTEM_INSTRUCTION_ANALYSIS = `You are an expert educational analyst. 
Analyze the provided meeting transcript. 
Output a JSON object with the following structure:
{
  "summary": "Short paragraph summary",
  "metrics": [
    {"name": "Academic Progress", "score": 80, "max": 100, "description": "short desc"},
    {"name": "Engagement", "score": 75, "max": 100, "description": "short desc"},
    {"name": "Communication", "score": 90, "max": 100, "description": "short desc"},
    {"name": "Emotional Well-being", "score": 85, "max": 100, "description": "short desc"}
  ],
  "swot": {
    "strengths": ["string", "string"],
    "weaknesses": ["string", "string"],
    "opportunities": ["string", "string"],
    "threats": ["string", "string"]
  },
  "topics": ["topic1", "topic2"]
}
Ensure the response is valid JSON.`;
