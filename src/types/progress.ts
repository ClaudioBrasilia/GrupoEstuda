export interface StudySessionWithSubject {
  id: string;
  started_at: string;
  completed_at: string | null;
  duration_minutes: number;
  subject_id?: string | null;
  subjects?: {
    id: string;
    name: string;
  } | null;
}
