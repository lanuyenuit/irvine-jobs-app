export interface CV {
  id: number;
  filename: string;
  raw_text: string;
  file_size: number;
  created_at: string;
}

export interface CVExperience {
  title: string;
  company: string;
  period: string;
  location?: string;
  bullets: string[];
}

export interface CVEducation {
  degree: string;
  school: string;
  year: string;
}

export interface FullCV {
  name: string;
  contact: string;
  summary: string;
  experience: CVExperience[];
  skills: string[];
  education: CVEducation[];
  certifications?: string[];
}

export interface TailoredCV {
  match_score: number;
  summary: string;
  key_skills: string[];
  experience_bullets: string[];
  cover_letter_intro: string;
  cover_letter: string;
  keywords: string[];
  suggestions: string[];
  full_cv?: FullCV;
}
