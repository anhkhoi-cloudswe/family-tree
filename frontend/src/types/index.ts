export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: string;
  trees?: FamilyTree[];
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
