import { Person, Relationship } from '@prisma/client';

export interface KinshipResult {
  fromPerson: string;
  toPerson: string;
  kinshipTitle: string;        // Danh xưng: Ví dụ: "Bác ruột (Bác trai)", "Chú họ", "Cháu gái"...
  addressing: string;          // Cách gọi: "Gọi là Bác, xưng Cháu"
  pathDescription: string[];   // Diễn giải từng bước quan hệ
  generationDiff: number;      // Chênh lệch thế hệ (dương = lớn hơn, âm = nhỏ hơn)
}

export class KinshipService {
  /**
   * Tính toán xưng hô giữa 2 người trong cây gia phả
   */
  static calculateKinship(
    personA: Person,
    personB: Person,
    allPersons: Person[],
    allRels: Relationship[]
  ): KinshipResult {
    if (personA.id === personB.id) {
      return {
        fromPerson: personA.fullName,
        toPerson: personB.fullName,
        kinshipTitle: 'Chính bản thân bạn',
        addressing: 'Bản thân',
        pathDescription: ['Cùng một người'],
        generationDiff: 0,
      };
    }

    const personMap = new Map<string, Person>();
    allPersons.forEach((p) => personMap.set(p.id, p));

    // Kiểm tra trực tiếp Vợ / Chồng
    const spouseRel = allRels.find(
      (r) =>
        r.type === 'SPOUSE' &&
        ((r.spouse1Id === personA.id && r.spouse2Id === personB.id) ||
          (r.spouse1Id === personB.id && r.spouse2Id === personA.id))
    );
    if (spouseRel) {
      const isMale = personB.gender === 'MALE';
      const title = isMale ? 'Chồng' : 'Vợ';
      return {
        fromPerson: personA.fullName,
        toPerson: personB.fullName,
        kinshipTitle: title,
        addressing: isMale ? 'Gọi là Chồng/Anh, xưng Em/Vợ' : 'Gọi là Vợ/Em, xưng Anh/Chồng',
        pathDescription: [`${personB.fullName} là bạn đời (${title.toLowerCase()}) của ${personA.fullName}`],
        generationDiff: 0,
      };
    }

    // Kiểm tra Cha/Mẹ trực tiếp
    const parentRel = allRels.find(
      (r) => r.type === 'PARENT_CHILD' && r.parentId === personB.id && r.childId === personA.id
    );
    if (parentRel) {
      const title = personB.gender === 'MALE' ? 'Bố (Cha)' : 'Mẹ';
      return {
        fromPerson: personA.fullName,
        toPerson: personB.fullName,
        kinshipTitle: title,
        addressing: `Gọi là ${title}, xưng Con`,
        pathDescription: [`${personB.fullName} là sinh thành (${title}) của ${personA.fullName}`],
        generationDiff: 1,
      };
    }

    // Kiểm tra Con cái trực tiếp
    const childRel = allRels.find(
      (r) => r.type === 'PARENT_CHILD' && r.parentId === personA.id && r.childId === personB.id
    );
    if (childRel) {
      const title = personB.gender === 'MALE' ? 'Con trai' : 'Con gái';
      return {
        fromPerson: personA.fullName,
        toPerson: personB.fullName,
        kinshipTitle: title,
        addressing: `Gọi là Con, xưng ${personA.gender === 'MALE' ? 'Bố' : 'Mẹ'}`,
        pathDescription: [`${personB.fullName} là con ruột của ${personA.fullName}`],
        generationDiff: -1,
      };
    }

    // Thuật toán tìm đường đi ngắn nhất (BFS)
    const { path, relTypes } = this.findShortestPath(personA.id, personB.id, allPersons, allRels);

    const genDiff = (personA.generation || 1) - (personB.generation || 1); // Dương = B ở thế hệ cao hơn A
    const isMaleB = personB.gender === 'MALE';

    let kinshipTitle = 'Họ hàng';
    let addressing = 'Tùy theo tuổi tác hoặc vai vế dòng tộc';

    if (genDiff === 0) {
      // Cùng thế hệ: Anh / Chị / Em ruột hoặc họ
      const isSibling = this.areSiblings(personA.id, personB.id, allRels);
      if (isSibling) {
        if (isMaleB) {
          kinshipTitle = 'Anh trai ruột';
          addressing = 'Gọi là Anh, xưng Em';
        } else {
          kinshipTitle = 'Chị gái ruột';
          addressing = 'Gọi là Chị, xưng Em';
        }
      } else {
        if (isMaleB) {
          kinshipTitle = 'Anh họ';
          addressing = 'Gọi là Anh họ, xưng Em';
        } else {
          kinshipTitle = 'Chị / Em gái họ';
          addressing = 'Gọi là Chị/Em họ';
        }
      }
    } else if (genDiff === 1) {
      // Thế hệ trên 1 đời: Bác, Chú, Cô, Cậu, Dì
      if (isMaleB) {
        kinshipTitle = 'Bác / Chú (bên nội hoặc ngoại)';
        addressing = 'Gọi là Bác hoặc Chú, xưng Cháu';
      } else {
        kinshipTitle = 'Cô / Dì / Bác gái';
        addressing = 'Gọi là Cô hoặc Dì, xưng Cháu';
      }
    } else if (genDiff === -1) {
      // Thế hệ dưới 1 đời: Cháu (con của anh/chị/em)
      kinshipTitle = isMaleB ? 'Cháu trai' : 'Cháu gái';
      addressing = 'Gọi là Cháu, xưng Bác/Chú/Cô/Dì';
    } else if (genDiff === 2) {
      // Thế hệ trên 2 đời: Ông / Bà
      kinshipTitle = isMaleB ? 'Ông (Nội/Ngoại/Bác)' : 'Bà (Nội/Ngoại/Bác)';
      addressing = `Gọi là ${isMaleB ? 'Ông' : 'Bà'}, xưng Cháu`;
    } else if (genDiff === -2) {
      // Thế hệ dưới 2 đời: Cháu nội / Cháu ngoại
      kinshipTitle = isMaleB ? 'Cháu trai thế hệ thứ 2' : 'Cháu gái thế hệ thứ 2';
      addressing = 'Gọi là Cháu, xưng Ông/Bà';
    } else if (genDiff === 3) {
      kinshipTitle = isMaleB ? 'Cụ ông (Cố)' : 'Cụ bà (Cố)';
      addressing = 'Gọi là Cụ, xưng Chắt';
    } else if (genDiff === -3) {
      kinshipTitle = 'Chắt';
      addressing = 'Gọi là Chắt, xưng Cụ';
    } else if (genDiff >= 4) {
      kinshipTitle = 'Thủy Tổ / Tiền Bối (Kỵ, Sơ)';
      addressing = 'Gọi là Cụ Tổ / Tiền Nhân';
    } else if (genDiff <= -4) {
      kinshipTitle = 'Chút / Chít';
      addressing = 'Con cháu đời sau';
    }

    const pathDesc = path.map((id, index) => {
      const p = personMap.get(id);
      return `${index + 1}. ${p?.fullName || id} (Đời ${p?.generation || '?'})`;
    });

    return {
      fromPerson: personA.fullName,
      toPerson: personB.fullName,
      kinshipTitle,
      addressing,
      pathDescription: pathDesc.length > 0 ? pathDesc : ['Quan hệ qua cây gia phả chung'],
      generationDiff: genDiff,
    };
  }

  private static areSiblings(idA: string, idB: string, allRels: Relationship[]): boolean {
    const parentsOfA = allRels
      .filter((r) => r.type === 'PARENT_CHILD' && r.childId === idA)
      .map((r) => r.parentId);
    const parentsOfB = allRels
      .filter((r) => r.type === 'PARENT_CHILD' && r.childId === idB)
      .map((r) => r.parentId);
    return parentsOfA.some((p) => parentsOfB.includes(p));
  }

  private static findShortestPath(
    startId: string,
    endId: string,
    allPersons: Person[],
    allRels: Relationship[]
  ): { path: string[]; relTypes: string[] } {
    // Xây dựng đồ thị vô hướng
    const adj = new Map<string, Array<{ to: string; type: string }>>();
    allPersons.forEach((p) => adj.set(p.id, []));

    allRels.forEach((r) => {
      if (r.type === 'PARENT_CHILD' && r.parentId && r.childId) {
        adj.get(r.parentId)?.push({ to: r.childId, type: 'CHA_ME_CON' });
        adj.get(r.childId)?.push({ to: r.parentId, type: 'CON_CHA_ME' });
      } else if (r.type === 'SPOUSE' && r.spouse1Id && r.spouse2Id) {
        adj.get(r.spouse1Id)?.push({ to: r.spouse2Id, type: 'VO_CHONG' });
        adj.get(r.spouse2Id)?.push({ to: r.spouse1Id, type: 'VO_CHONG' });
      }
    });

    // BFS
    const visited = new Set<string>();
    const queue: Array<{ id: string; path: string[]; relTypes: string[] }> = [
      { id: startId, path: [startId], relTypes: [] },
    ];
    visited.add(startId);

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.id === endId) {
        return { path: current.path, relTypes: current.relTypes };
      }

      const neighbors = adj.get(current.id) || [];
      for (const edge of neighbors) {
        if (!visited.has(edge.to)) {
          visited.add(edge.to);
          queue.push({
            id: edge.to,
            path: [...current.path, edge.to],
            relTypes: [...current.relTypes, edge.type],
          });
        }
      }
    }

    return { path: [], relTypes: [] };
  }
}
