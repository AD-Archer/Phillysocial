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
  bannedUsers?: string[]; // Users who are banned from the channel
  mutedUsers?: string[]; // Users who are muted in the channel
  deleted?: boolean; // Whether the channel has been deleted
  deletedAt?: Date; // When the channel was deleted
  deletedBy?: string; // Who deleted the channel
} 