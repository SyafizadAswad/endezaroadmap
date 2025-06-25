import { Subject } from './geminiService';

export class DataService {
  private subjects: Subject[] = [];
  private isLoading: boolean = false;
  private isLoaded: boolean = false;
  private loadPromise: Promise<void> | null = null;

  constructor() {
    this.loadPromise = this.loadSubjects();
  }

  private async loadSubjects(): Promise<void> {
    if (this.isLoading && this.loadPromise) {
      return this.loadPromise;
    }
    
    if (this.isLoaded) {
      return;
    }
    
    this.isLoading = true;
    try {
      console.log('Loading syllabus data from /syllabus.json...');
      const response = await fetch('/syllabus.json');
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        throw new Error(`Failed to load syllabus: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Syllabus data loaded:', data);
      console.log('Number of subjects in data:', data.subjects?.length || 0);
      
      this.subjects = data.subjects as Subject[];
      this.isLoaded = true;
      console.log('Subjects loaded successfully:', this.subjects.length);
    } catch (error) {
      console.error('Error loading syllabus data:', error);
      this.subjects = [];
    } finally {
      this.isLoading = false;
    }
  }

  async getAllSubjects(): Promise<Subject[]> {
    // Wait for the initial load to complete
    if (this.loadPromise) {
      await this.loadPromise;
    }
    
    console.log('getAllSubjects called, returning:', this.subjects.length, 'subjects');
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