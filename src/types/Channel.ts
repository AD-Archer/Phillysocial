export interface Channel {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: Date;
  imageUrl?: string;
  members: string[]; // user IDs
  isPublic: boolean;
} 