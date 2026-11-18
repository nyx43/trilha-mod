export const tutorPath = '/api/lesson-tutor';
export const tutorTurnstileAction = 'lesson_tutor';
export const tutorLimits = { question: 1500, reply: 8000, context: 6500, history: 8 };

export interface TutorMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface TutorRequest {
  context: string;
  messages: TutorMessage[];
  provider?: string;
  model?: string;
  turnstileToken?: string;
}

export interface TutorModel {
  id: string;
  label: string;
}

export interface TutorProvider {
  id: string;
  label: string;
  defaultModel: string;
  models: TutorModel[];
}

export interface TutorStatus {
  enabled: boolean;
  providers: TutorProvider[];
  turnstileSiteKey?: string;
}
