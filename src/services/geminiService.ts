import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY || '');

export interface Subject {
  id: string;
  code: string;
  name: string;
  credits: number;
  year: number;
  semester: number;
  department: string;
  syllabus: string[];
  description: string;
  prerequisites: string[];
  keywords: string[];
  learning_outcomes: string[];
  career_relevance?: Record<string, number>;
  career_relevance_reason?: Record<string, string>;
}

export interface RoadmapNode {
  id: string;
  name: string;
  x: number;
  y: number;
  type: 'foundation' | 'core' | 'specialized' | 'elective';
  completed: boolean;
  connects: string[];
  credits: number;
  year: number;
  semester: number;
  relevance_score: number;
}

export interface GeneratedRoadmap {
  title: string;
  description: string;
  occupation: string;
  nodes: RoadmapNode[];
  total_credits: number;
  reasoning: string;
}

const OCCUPATIONS = [
  'electrical_engineer',
  'power_engineer',
  'electronics_engineer',
  'communication_engineer',
  'aerospace_engineer',
  'software_engineer',
  'control_engineer',
  'robotics_engineer',
];

export class GeminiService {
  private model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  private parseJSONResponse(text: string): any {
    try {
      // First, try to parse as-is
      return JSON.parse(text);
    } catch (error) {
      // If that fails, try to extract JSON from markdown code blocks
      const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1]);
        } catch (parseError) {
          console.error('Failed to parse JSON from code block:', parseError);
          throw new Error('Invalid JSON response from AI');
        }
      }
      
      // If no code block found, try to find JSON object in the text
      const jsonObjectMatch = text.match(/\{[\s\S]*\}/);
      if (jsonObjectMatch) {
        try {
          return JSON.parse(jsonObjectMatch[0]);
        } catch (parseError) {
          console.error('Failed to parse JSON object from text:', parseError);
          throw new Error('Invalid JSON response from AI');
        }
      }
      
      throw new Error('No valid JSON found in response');
    }
  }

  async generateRoadmap(occupation: string, subjects: Subject[]): Promise<GeneratedRoadmap> {
    try {
      const prompt = this.createRoadmapPrompt(occupation, subjects);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const roadmapData = this.parseJSONResponse(text);
      return roadmapData;
    } catch (error) {
      throw new Error('Failed to generate roadmap');
    }
  }

  private createRoadmapPrompt(occupation: string, subjects: Subject[]): string {
    return `
You are an expert educational advisor at Tokushima University. Your task is to create a personalized course roadmap for a student aiming to become a ${occupation}.

Given the following subjects (with their syllabi and details), select the most relevant subjects for the occupation of ${occupation} and generate a roadmap:

${JSON.stringify(subjects, null, 2)}

Requirements:
- Select 8-12 most relevant subjects for the occupation
- Organize by academic progression (year 1 → year 4)
- Assign appropriate node types: 'foundation', 'core', 'specialized', 'elective'
- Calculate x,y coordinates for visual layout (x: 100-700, y: 100-600)
- Create logical connections between related subjects
- Calculate total credits
- Provide detailed reasoning for subject selection

IMPORTANT: Return ONLY a valid JSON object with this exact structure, no markdown formatting or additional text:

{
  "title": "Roadmap Title",
  "description": "Brief description of the roadmap",
  "occupation": "${occupation}",
  "nodes": [
    {
      "id": "subject_id",
      "name": "Subject Name",
      "x": 200,
      "y": 100,
      "type": "foundation|core|specialized|elective",
      "completed": false,
      "connects": ["connected_subject_id"],
      "credits": 2,
      "year": 1,
      "semester": 1,
      "relevance_score": 0.95
    }
  ],
  "total_credits": 24,
  "reasoning": "Detailed explanation of why these subjects were selected and how they prepare for the target occupation"
}

Focus on subjects that directly contribute to the skills and knowledge needed for ${occupation}.
`;
  }
}

export const geminiService = new GeminiService(); 