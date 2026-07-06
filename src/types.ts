export interface Project {
  id: string;
  name: string;
  type: string;
  description?: string;
  code: string;
  status: 'open' | 'closed';
  locked?: boolean;
  authorId: string;
  authorName: string;
  authorEmail?: string;
  createdAt: any; // Firestore Timestamp or Date
  updatedAt: any; // Firestore Timestamp or Date
  views?: number;
  collaborators?: string[];
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  profilePictureUrl?: string;
  isAdmin?: boolean;
  isBanned?: boolean;
  isBan?: boolean;
  createdAt: any;
  lastLoginAt: any;
}
