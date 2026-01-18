export interface Subtopic {
  name: string;
  index: number;
}

export interface Chapter {
  chapter: string;
  index: number;
  subtopics: Subtopic[];
}

export interface Topic {
  category: string; // Your JSON uses "category", NOT "topic" or "name"
  index: number;
  chapters: Chapter[];
}

export interface Question {
  id: string;
  subject?: string;
  topic?: string;
  chapter?: string;
  subtopic: string;
  difficulty: string;
  // No image field here, so it will just be ignored/skipped automatically
  question: {
    uz: string;
    ru: string;
    en: string;
  };
  options: {
    A: { uz: string; ru: string; en: string };
    B: { uz: string; ru: string; en: string };
    C: { uz: string; ru: string; en: string };
    D: { uz: string; ru: string; en: string };
  };
  answer: string; // "A", "B", "C", or "D"
}