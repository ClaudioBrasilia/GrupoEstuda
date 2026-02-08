
export interface Message {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: Date;
}

export interface GoalType {
  id: string;
  subject: string;
  type: 'exercises' | 'pages' | 'time';
  target: number;
  current: number;
}

export interface FileType {
  id: string;
  name: string;
  size: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface Subject {
  id: string;
  name: string;
}

export interface Member {
  id: string;
  name: string;
  isAdmin: boolean;
}
