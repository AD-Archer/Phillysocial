export interface Post {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  channelId: string;
  createdAt: Date;
  lastEdited?: Date;
  likes: string[]; // user IDs
  comments: Comment[];
  imageUrl?: string;
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  createdAt: Date;
} 