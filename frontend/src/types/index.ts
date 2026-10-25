export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  avatarUrl?: string;
  role: string;
  trees?: FamilyTree[];
}

export type TreeRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export interface TreeCollaborator {
  id: string;
  treeId: string;
  userId: string;
  role: 'EDITOR' | 'VIEWER';
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
  role: 'EDITOR' | 'VIEWER';
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
  userRole?: TreeRole;
  linkedPersonId?: string | null;
  members: Person[];
  relationships: Relationship[];
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
