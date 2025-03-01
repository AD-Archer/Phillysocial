export interface Channel {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: Date;
  imageUrl?: string;
  members: string[]; // user IDs
  admins: string[]; // user IDs with admin privileges
  isPublic: boolean;
  invitedUsers?: string[]; // Invited users who haven't joined yet
  inviteCode?: string; // Unique invite code for private channels
  inviteCodeExpiry?: Date; // Optional expiration for invite codes
} 