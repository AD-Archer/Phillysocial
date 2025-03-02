import { Comment } from './Post';

export type EventCategory = 'sports' | 'food' | 'music' | 'arts' | 'tech' | 'community' | 'other';

export interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  location: string;
  category: EventCategory;
  isPublic?: boolean;
  imageUrl?: string | null;
  capacity?: number | null;
  attendees: string[];
  admins?: string[];
  createdBy: string;
  createdAt: Date;
  lastEdited?: Date | null;
  comments: Comment[];
  organizer: {
    id: string;
    name: string;
    photoURL?: string;
  };
} 