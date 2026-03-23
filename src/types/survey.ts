export type QuestionType = 'multiple_choice' | 'checkbox' | 'rating' | 'text';

export interface SurveyQuestion {
  id: string;
  text: string;
  type: QuestionType;
  options: string[] | null;
  order: number;
}

export interface Survey {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  is_active: boolean;
  questions: SurveyQuestion[];
}

export interface PublicSurvey {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  is_active: boolean;
  is_public: boolean;
  already_submitted: boolean;
  questions_count?: number;
  questions: SurveyQuestion[];
}

export interface SurveyAnswerPayload {
  question_id: string;
  answer: string | string[] | number;
}
