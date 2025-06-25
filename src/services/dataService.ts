import syllabusData from '../../syllabus.json';
import { Subject } from './geminiService';

export class DataService {
  private subjects: Subject[] = [];

  constructor() {
    this.loadSubjects();
  }

  private loadSubjects() {
    try {
      this.subjects = syllabusData.subjects as Subject[];
    } catch (error) {
      console.error('Error loading syllabus data:', error);
      this.subjects = [];
    }
  }

  getAllSubjects(): Subject[] {
    return this.subjects;
  }

  getSubjectsByYear(year: number): Subject[] {
    return this.subjects.filter(subject => subject.year === year);
  }

  getSubjectsBySemester(year: number, semester: number): Subject[] {
    return this.subjects.filter(subject => 
      subject.year === year && subject.semester === semester
    );
  }

  getSubjectById(id: string): Subject | undefined {
    return this.subjects.find(subject => subject.id === id);
  }

  getSubjectsByKeywords(keywords: string[]): Subject[] {
    return this.subjects.filter(subject =>
      keywords.some(keyword =>
        subject.keywords.some(k => k.toLowerCase().includes(keyword.toLowerCase())) ||
        subject.name.toLowerCase().includes(keyword.toLowerCase()) ||
        subject.description.toLowerCase().includes(keyword.toLowerCase())
      )
    );
  }

  getTotalCredits(): number {
    return this.subjects.reduce((total, subject) => total + subject.credits, 0);
  }

  getSubjectsByCareerRelevance(occupation: string, threshold: number = 0.5): Subject[] {
    return this.subjects.filter(subject => {
      const relevance = subject.career_relevance[occupation.toLowerCase()];
      return relevance && relevance >= threshold;
    }).sort((a, b) => {
      const relevanceA = a.career_relevance[occupation.toLowerCase()] || 0;
      const relevanceB = b.career_relevance[occupation.toLowerCase()] || 0;
      return relevanceB - relevanceA;
    });
  }
}

export const dataService = new DataService(); 