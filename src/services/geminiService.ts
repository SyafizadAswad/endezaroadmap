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
  career_relevance: Record<string, number>;
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
      
      // Parse the JSON response, handling markdown formatting
      const roadmapData = this.parseJSONResponse(text);
      return roadmapData;
    } catch (error) {
      console.error('Error generating roadmap:', error);
      throw new Error('Failed to generate roadmap');
    }
  }

  async updateCareerRelevance(subjects: Subject[]): Promise<Subject[]> {
    try {
      const prompt = this.createCareerRelevancePrompt(subjects);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse the JSON response, handling markdown formatting
      const updatedSubjects = this.parseJSONResponse(text);
      return updatedSubjects;
    } catch (error) {
      console.error('Error updating career relevance:', error);
      return subjects; // Return original subjects if update fails
    }
  }

  private createRoadmapPrompt(occupation: string, subjects: Subject[]): string {
    return `
You are an expert educational advisor at Tokushima University. Your task is to create a personalized course roadmap for a student aiming to become a ${occupation}.

Given the following subjects from the Electrical and Electronic System Course, create a roadmap that:
1. Selects the most relevant subjects for the target occupation
2. Organizes them in a logical learning sequence
3. Respects prerequisites and academic year progression
4. Provides reasoning for subject selection

Available subjects:
${JSON.stringify(subjects, null, 2)}

Requirements:
- Select 8-12 most relevant subjects
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

  private createCareerRelevancePrompt(subjects: Subject[]): string {
    return `
You are an expert career counselor. Analyze the following subjects and update their career relevance scores for different engineering occupations.

For each subject, evaluate its relevance to these occupations:
- electrical_engineer
- power_engineer  
- electronics_engineer
- communication_engineer
- aerospace_engineer
- software_engineer
- control_engineer
- robotics_engineer

Consider:
- Subject content and learning outcomes
- Skills developed
- Knowledge areas covered
- Industry applications

Score from 0.0 (not relevant) to 1.0 (highly relevant).

IMPORTANT: Return ONLY the updated subjects array as valid JSON, no markdown formatting or additional text. Update only the career_relevance field for each subject. Keep all other fields unchanged.

${JSON.stringify(subjects, null, 2)}
`;
  }
}

export const geminiService = new GeminiService(); 