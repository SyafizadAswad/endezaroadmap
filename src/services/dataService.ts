import { Subject } from './geminiService';

export class DataService {
  private subjects: Subject[] = [];
  private isLoading: boolean = false;
  private isLoaded: boolean = false;

  constructor() {
    this.loadSubjects();
  }

  private async loadSubjects() {
    if (this.isLoading || this.isLoaded) return;
    
    this.isLoading = true;
    try {
      const response = await fetch('/syllabus.json');
      if (!response.ok) {
        throw new Error(`Failed to load syllabus: ${response.status}`);
      }
      const data = await response.json();
      this.subjects = data.subjects as Subject[];
      this.isLoaded = true;
    } catch (error) {
      console.error('Error loading syllabus data:', error);
      this.subjects = [];
    } finally {
      this.isLoading = false;
    }
  }

  async getAllSubjects(): Promise<Subject[]> {
    if (!this.isLoaded) {
      await this.loadSubjects();
    }
    return this.subjects;
  }

  async getSubjectsByYear(year: number): Promise<Subject[]> {
    const subjects = await this.getAllSubjects();
    return subjects.filter(subject => subject.year === year);
  }

  async getSubjectsBySemester(year: number, semester: number): Promise<Subject[]> {
    const subjects = await this.getAllSubjects();
    return subjects.filter(subject => 
      subject.year === year && subject.semester === semester
    );
  }

  async getSubjectById(id: string): Promise<Subject | undefined> {
    const subjects = await this.getAllSubjects();
    return subjects.find(subject => subject.id === id);
  }

  async getSubjectsByKeywords(keywords: string[]): Promise<Subject[]> {
    const subjects = await this.getAllSubjects();
    return subjects.filter(subject =>
      keywords.some(keyword =>
        subject.keywords.some(k => k.toLowerCase().includes(keyword.toLowerCase())) ||
        subject.name.toLowerCase().includes(keyword.toLowerCase()) ||
        subject.description.toLowerCase().includes(keyword.toLowerCase())
      )
    );
  }

  async getTotalCredits(): Promise<number> {
    const subjects = await this.getAllSubjects();
    return subjects.reduce((total, subject) => total + subject.credits, 0);
  }

  async getSubjectsByCareerRelevance(occupation: string, threshold: number = 0.5): Promise<Subject[]> {
    const subjects = await this.getAllSubjects();
    return subjects.filter(subject => {
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