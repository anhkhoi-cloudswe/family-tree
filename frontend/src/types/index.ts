export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  phoneVerified?: boolean;
  avatarUrl?: string | null;
  role: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'PENDING_DELETE';
  deletedAt?: string | null;
  subscriptionTier?: 'FREE' | 'PRO';
  subscriptionExpiresAt?: string | null;
  trees?: FamilyTree[];
}

export interface SubscriptionStatus {
  tier: 'FREE' | 'PRO';
  rawTier?: string;
  expiresAt?: string | null;
  isExpired: boolean;
  totalBranches: number;
  ownedCount: number;
  joinedCount: number;
  maxFreeBranches: number;
  isLimitReached: boolean;
  canCreateMore?: boolean;
  lockedBranchesCount: number;
}

export type TreeRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export interface PhoneOtpStatus {
  attemptsToday: number;
  maxDaily: number;
  remaining: number;
  isLocked: boolean;
}

export interface TreeCollaborator {
  id: string;
  treeId: string;
  userId: string;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
  personId?: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    phone?: string | null;
    avatarUrl?: string | null;
  };
  person?: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
    generation: number;
  } | null;
}

export interface TreeInvitation {
  id: string;
  treeId: string;
  inviterId: string;
  receiverId: string;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  message?: string | null;
  createdAt: string;
  tree: {
    id: string;
    name: string;
    branchName?: string | null;
  };
  inviter: {
    id: string;
    email: string;
    fullName: string;
    phone?: string | null;
    avatarUrl?: string | null;
  };
  receiver?: {
    id: string;
    email: string;
    fullName: string;
    phone?: string | null;
    avatarUrl?: string | null;
  };
}

export interface Person {
  id: string;
  treeId: string;
  fullName: string;
  nickname?: string | null;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  phone?: string | null;
  address?: string | null;
  generation: number;
  birthDate?: string | null;
  isDeceased: boolean;
  deathDate?: string | null;
  lunarDeathDay?: string | null;
  burialPlace?: string | null;
  burialCoordinates?: string | null;
  avatarUrl?: string | null;
  biography?: string | null;
  relativeOrder?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Relationship {
  id: string;
  treeId: string;
  type: 'PARENT_CHILD' | 'SPOUSE' | 'ADOPTED' | 'SIBLING';
  parentId?: string | null;
  childId?: string | null;
  spouse1Id?: string | null;
  spouse2Id?: string | null;
}

export interface FamilyTree {
  id: string;
  name: string;
  description?: string | null;
  branchName?: string | null;
  ancestorInfo?: string | null;
  ownerId: string;
  owner?: {
    id: string;
    fullName: string;
    phone?: string | null;
  };
  userRole?: TreeRole;
  linkedPersonId?: string | null;
  members: Person[];
  relationships: Relationship[];
  membersCount?: number;
  isLocked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KinshipResult {
  fromPerson: string;
  toPerson: string;
  kinshipTitle: string;
  addressing: string;
  pathDescription: string[];
  generationDiff: number;
}
