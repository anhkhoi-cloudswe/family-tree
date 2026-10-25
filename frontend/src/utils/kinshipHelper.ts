import { Person, Relationship } from '../types';
import { getYearFromDate } from './dateHelper';

/**
 * So sánh độ tuổi hoặc thứ bậc giữa 2 người:
 * 1. Ưu tiên số năm sinh / ngày sinh nếu có nhập:
 *    - Nếu cả 2 đều có ngày sinh / năm sinh: so sánh năm sinh (hoặc timestamp). Người sinh trước sẽ lớn hơn.
 *    - Nếu chỉ 1 người có năm sinh: người có năm sinh sớm hơn hoặc thông tin thứ bậc được kiểm tra qua nickname/ghi chú.
 * 2. Phân tích ngữ nghĩa nickname/tên gọi/vai vế:
 *    - Bác, Cả, Anh, Chị, Hai, Lớn -> lớn hơn.
 *    - Chú, Cô, Cậu, Dì, Em, Út, Nhỏ -> nhỏ hơn.
 */
export function compareAgeOrRank(personA: Person, personB?: Person | null): boolean {
  if (!personB) {
    const nickA = (personA.nickname || '').toLowerCase();
    return nickA.includes('bác') || nickA.includes('cả') || nickA.includes('anh') || nickA.includes('chị') || nickA.includes('hai');
  }

  // 1. So sánh ngày sinh / năm sinh
  const yearA = getYearFromDate(personA.birthDate);
  const yearB = getYearFromDate(personB.birthDate);

  if (yearA !== null && yearB !== null) {
    if (yearA !== yearB) {
      return yearA < yearB; // Năm sinh nhỏ hơn tức là sinh trước -> lớn tuổi hơn
    }
    // Cùng năm sinh thì so sánh chi tiết ngày tháng nếu có
    if (personA.birthDate && personB.birthDate) {
      const timeA = new Date(personA.birthDate).getTime();
      const timeB = new Date(personB.birthDate).getTime();
      if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) {
        return timeA < timeB;
      }
    }
  }

  // 2. Nếu thiếu năm sinh của 1 trong 2 người, kiểm tra nickname hoặc danh xưng
  const nickA = (personA.nickname || '').toLowerCase();
  const nickB = (personB.nickname || '').toLowerCase();

  // personA có dấu hiệu là vai anh/chị/bác
  if (nickA.includes('bác') || nickA.includes('cả') || nickA.includes('anh') || nickA.includes('chị') || nickA.includes('hai') || nickA.includes('lớn')) {
    return true;
  }
  // personA có dấu hiệu là em/chú/cô/cậu/dì/út
  if (nickA.includes('chú') || nickA.includes('cô') || nickA.includes('cậu') || nickA.includes('dì') || nickA.includes('em') || nickA.includes('út')) {
    return false;
  }

  // personB có dấu hiệu là anh/chị/bác mà personA không có -> personA nhỏ hơn
  if (nickB.includes('bác') || nickB.includes('cả') || nickB.includes('anh') || nickB.includes('chị') || nickB.includes('hai')) {
    return false;
  }

  // personB có dấu hiệu là em/út -> personA có thể lớn hơn
  if (nickB.includes('em') || nickB.includes('út')) {
    return true;
  }

  // Fallback mặc định
  return false;
}

/**
 * Tính toán danh xưng vai vế chuẩn hóa theo góc nhìn của "Tôi" (Người quan sát)
 * Tuân thủ quy tắc tiếng Việt chuẩn dòng họ:
 * - Tách bạch rõ huyết thống và hôn nhân.
 * - Phân biệt chính xác Bên Nội (Bố, Ông bà nội, Bác/Chú/Cô) và Bên Ngoại (Mẹ, Ông bà ngoại, Cậu/Dì).
 * - Xử lý chuẩn xác dâu rể (Vợ của Bác ruột, Chồng của Cô ruột, Chị dâu, Anh rể...).
 * - Fallback: "Người thân" thay vì đoán mò mơ hồ.
 */
export function getKinshipToMe(
  me: Person | null | undefined,
  target: Person,
  allPersons: Person[],
  allRels: Relationship[],
  visitedIds: Set<string> = new Set()
): string {
  if (!me) {
    if (target.nickname === 'Tôi' || target.nickname === 'Tôi (Khởi tạo)') {
      return 'Chủ nhánh';
    }
    if (target.generation === 1) return 'Thủy Tổ';
    if (target.nickname && !target.nickname.toLowerCase().includes('tôi')) {
      return target.nickname;
    }
    return `Thế hệ ${target.generation}`;
  }

  // 1. Bản thân
  if (me.id === target.id) {
    return 'Tôi';
  }

  // Circular reference guard against infinite recursion between spouses
  if (visitedIds.has(target.id)) {
    return 'Người thân';
  }
  const nextVisited = new Set(visitedIds);
  nextVisited.add(target.id);

  // 2. Vợ / Chồng trực tiếp
  const isSpouse = allRels.some(
    (r) =>
      r.type === 'SPOUSE' &&
      ((r.spouse1Id === me.id && r.spouse2Id === target.id) ||
        (r.spouse1Id === target.id && r.spouse2Id === me.id))
  );
  if (isSpouse) {
    return target.gender === 'MALE' ? 'Chồng' : 'Vợ';
  }

  // 3. Cha / Mẹ trực tiếp
  const isParent = allRels.some(
    (r) => r.type === 'PARENT_CHILD' && r.parentId === target.id && r.childId === me.id
  );
  if (isParent) {
    return target.gender === 'MALE' ? 'Bố' : 'Mẹ';
  }

  // 4. Con ruột trực tiếp
  const isChild = allRels.some(
    (r) => r.type === 'PARENT_CHILD' && r.parentId === me.id && r.childId === target.id
  );
  if (isChild) {
    return target.gender === 'MALE' ? 'Con trai' : 'Con gái';
  }

  // Lấy danh sách cha mẹ của "Tôi"
  const myParentIds = allRels
    .filter((r) => r.type === 'PARENT_CHILD' && r.childId === me.id && r.parentId)
    .map((r) => r.parentId as string);

  const myFather = allPersons.find((p) => myParentIds.includes(p.id) && p.gender === 'MALE');
  const myMother = allPersons.find((p) => myParentIds.includes(p.id) && p.gender === 'FEMALE');

  const paternalGrandparentIds = myFather
    ? allRels
        .filter((r) => r.type === 'PARENT_CHILD' && r.childId === myFather.id && r.parentId)
        .map((r) => r.parentId as string)
    : [];

  const maternalGrandparentIds = myMother
    ? allRels
        .filter((r) => r.type === 'PARENT_CHILD' && r.childId === myMother.id && r.parentId)
        .map((r) => r.parentId as string)
    : [];

  // Lấy danh sách con ruột của "Tôi"
  const myChildIds = allRels
    .filter((r) => r.type === 'PARENT_CHILD' && r.parentId === me.id && r.childId)
    .map((r) => r.childId as string);

  // 5. Anh / Chị / Em ruột (Cùng cha hoặc cùng mẹ hoặc có quan hệ SIBLING trực tiếp)
  const isSibling = allRels.some(
    (r) =>
      r.type === 'PARENT_CHILD' &&
      r.childId === target.id &&
      myParentIds.includes(r.parentId as string)
  );
  const isDirectSibling = allRels.some(
    (r) =>
      r.type === 'SIBLING' &&
      ((r.spouse1Id === me.id && r.spouse2Id === target.id) ||
        (r.spouse2Id === me.id && r.spouse1Id === target.id))
  );
  if (isSibling || isDirectSibling) {
    const isTargetOlder = compareAgeOrRank(target, me);
    if (target.gender === 'MALE') {
      return isTargetOlder ? 'Anh trai' : 'Em trai';
    } else {
      return isTargetOlder ? 'Chị gái' : 'Em gái';
    }
  }

  // 6. Cháu ruột (Con của anh/chị/em ruột)
  const siblingIds = allPersons
    .filter((p) => p.id !== me.id)
    .filter((p) =>
      allRels.some(
        (r) =>
          r.type === 'PARENT_CHILD' &&
          r.childId === p.id &&
          myParentIds.includes(r.parentId as string)
      )
    )
    .map((p) => p.id);

  const isNephewNiece = allRels.some(
    (r) =>
      r.type === 'PARENT_CHILD' &&
      r.childId === target.id &&
      siblingIds.includes(r.parentId as string)
  );
  if (isNephewNiece) {
    return target.gender === 'MALE' ? 'Cháu trai ruột' : 'Cháu gái ruột';
  }

  // 7. Ông / Bà (Cha mẹ của Bố hoặc Mẹ)
  const isFatherParent = myFather
    ? allRels.some(
        (r) => r.type === 'PARENT_CHILD' && r.parentId === target.id && r.childId === myFather.id
      )
    : false;

  const isMotherParent = myMother
    ? allRels.some(
        (r) => r.type === 'PARENT_CHILD' && r.parentId === target.id && r.childId === myMother.id
      )
    : false;

  if (isFatherParent) {
    return target.gender === 'MALE' ? 'Ông nội' : 'Bà nội';
  }
  if (isMotherParent) {
    return target.gender === 'MALE' ? 'Ông ngoại' : 'Bà ngoại';
  }

  // Kiểm tra bạn đời của Ông nội / Bà nội hoặc Ông ngoại / Bà ngoại
  const spouseOfGrandparent = allRels.find(
    (r) =>
      r.type === 'SPOUSE' && (r.spouse1Id === target.id || r.spouse2Id === target.id)
  );
  if (spouseOfGrandparent) {
    const partnerId =
      spouseOfGrandparent.spouse1Id === target.id
        ? spouseOfGrandparent.spouse2Id
        : spouseOfGrandparent.spouse1Id;

    if (myFather && allRels.some((r) => r.type === 'PARENT_CHILD' && r.parentId === partnerId && r.childId === myFather.id)) {
      return target.gender === 'MALE' ? 'Ông nội' : 'Bà nội';
    }
    if (myMother && allRels.some((r) => r.type === 'PARENT_CHILD' && r.parentId === partnerId && r.childId === myMother.id)) {
      return target.gender === 'MALE' ? 'Ông ngoại' : 'Bà ngoại';
    }
  }

  // 8. Bác / Chú / Cô / Dì / Cậu (Anh chị em ruột của Bố hoặc Mẹ)
  let isPaternalUncleAunt = false; // Bên Nội (anh chị em của Bố)
  let isMaternalUncleAunt = false; // Bên Ngoại (anh chị em của Mẹ)

  if (myFather) {
    isPaternalUncleAunt =
      (paternalGrandparentIds.length > 0 &&
        allRels.some(
          (r) =>
            r.type === 'PARENT_CHILD' &&
            r.childId === target.id &&
            paternalGrandparentIds.includes(r.parentId as string)
        )) ||
      allRels.some(
        (r) =>
          r.type === 'SIBLING' &&
          ((r.spouse1Id === myFather.id && r.spouse2Id === target.id) ||
            (r.spouse2Id === myFather.id && r.spouse1Id === target.id))
      );
  }

  if (myMother) {
    isMaternalUncleAunt =
      (maternalGrandparentIds.length > 0 &&
        allRels.some(
          (r) =>
            r.type === 'PARENT_CHILD' &&
            r.childId === target.id &&
            maternalGrandparentIds.includes(r.parentId as string)
        )) ||
      allRels.some(
        (r) =>
          r.type === 'SIBLING' &&
          ((r.spouse1Id === myMother.id && r.spouse2Id === target.id) ||
            (r.spouse2Id === myMother.id && r.spouse1Id === target.id))
      );
  }

  if (isPaternalUncleAunt) {
    const isMale = target.gender === 'MALE';
    const isOlder = compareAgeOrRank(target, myFather);
    if (isMale) {
      // Anh trai của bố -> Bác ruột; Em trai của bố -> Chú ruột
      return isOlder ? 'Bác ruột' : 'Chú ruột';
    } else {
      // Chị gái của bố -> Bác ruột (hoặc Bác gái); Em gái của bố -> Cô ruột
      return isOlder ? 'Bác ruột' : 'Cô ruột';
    }
  }

  if (isMaternalUncleAunt) {
    const isMale = target.gender === 'MALE';
    const isOlder = compareAgeOrRank(target, myMother);
    if (isMale) {
      // Anh trai của mẹ -> Bác ruột (hoặc Bác trai); Em trai của mẹ -> Cậu ruột
      return isOlder ? 'Bác ruột' : 'Cậu ruột';
    } else {
      // Chị gái của mẹ -> Bác ruột (hoặc Bác gái); Em gái của mẹ -> Dì ruột
      return isOlder ? 'Bác ruột' : 'Dì ruột';
    }
  }

  // 9. Kiểm tra Vợ / Chồng của Người Thân (Hôn nhân trong dòng họ) - Hoàn toàn không đệ quy
  const spouseRel = allRels.find(
    (r) => r.type === 'SPOUSE' && (r.spouse1Id === target.id || r.spouse2Id === target.id)
  );
  if (spouseRel) {
    const partnerId = spouseRel.spouse1Id === target.id ? spouseRel.spouse2Id! : spouseRel.spouse1Id!;
    const partner = allPersons.find((p) => p.id === partnerId);
    if (partner) {
      // 9.1 Partner là con ruột của Tôi
      if (myChildIds.includes(partner.id)) {
        return target.gender === 'FEMALE' ? 'Con dâu' : 'Con rể';
      }

      // 9.2 Partner là anh / chị / em ruột của Tôi
      const isPartnerSibling =
        allRels.some(
          (r) =>
            r.type === 'PARENT_CHILD' &&
            r.childId === partner.id &&
            myParentIds.includes(r.parentId as string)
        ) ||
        allRels.some(
          (r) =>
            r.type === 'SIBLING' &&
            ((r.spouse1Id === me.id && r.spouse2Id === partner.id) ||
              (r.spouse2Id === me.id && r.spouse1Id === partner.id))
        );
      if (isPartnerSibling) {
        const isPartnerOlder = compareAgeOrRank(partner, me);
        if (partner.gender === 'MALE') {
          return isPartnerOlder ? 'Chị dâu' : 'Em dâu';
        } else {
          return isPartnerOlder ? 'Anh rể' : 'Em rể';
        }
      }

      // 9.3 Partner là anh/chị/em ruột của Bố (Bác ruột / Chú ruột / Cô ruột)
      if (myFather) {
        const paternalGrandparentIds = allRels
          .filter((r) => r.type === 'PARENT_CHILD' && r.childId === myFather.id && r.parentId)
          .map((r) => r.parentId as string);

        const isPartnerPaternalUncleAunt =
          (paternalGrandparentIds.length > 0 &&
            allRels.some(
              (r) =>
                r.type === 'PARENT_CHILD' &&
                r.childId === partner.id &&
                paternalGrandparentIds.includes(r.parentId as string)
            )) ||
          allRels.some(
            (r) =>
              r.type === 'SIBLING' &&
              ((r.spouse1Id === myFather.id && r.spouse2Id === partner.id) ||
                (r.spouse2Id === myFather.id && r.spouse1Id === partner.id))
          );

        if (isPartnerPaternalUncleAunt) {
          const isOlder = compareAgeOrRank(partner, myFather);
          if (partner.gender === 'MALE') {
            return isOlder ? 'Bác dâu' : 'Thím (Vợ của Chú)';
          } else {
            return isOlder ? 'Bác rể' : 'Dượng (Chồng của Cô)';
          }
        }
      }

      // 9.4 Partner là anh/chị/em ruột của Mẹ (Cậu ruột / Dì ruột / Bác ruột)
      if (myMother) {
        const isPartnerMaternalUncleAunt =
          (maternalGrandparentIds.length > 0 &&
            allRels.some(
              (r) =>
                r.type === 'PARENT_CHILD' &&
                r.childId === partner.id &&
                maternalGrandparentIds.includes(r.parentId as string)
            )) ||
          allRels.some(
            (r) =>
              r.type === 'SIBLING' &&
              ((r.spouse1Id === myMother.id && r.spouse2Id === partner.id) ||
                (r.spouse2Id === myMother.id && r.spouse1Id === partner.id))
          );

        if (isPartnerMaternalUncleAunt) {
          const isOlder = compareAgeOrRank(partner, myMother);
          if (partner.gender === 'MALE') {
            return isOlder ? 'Bác dâu' : 'Mợ (Vợ của Cậu)';
          } else {
            return isOlder ? 'Bác rể' : 'Dượng (Chồng của Dì)';
          }
        }
      }

      // 9.5 Partner cùng thế hệ với Tôi (Anh chị em họ)
      if (partner.generation === me.generation) {
        return target.gender === 'FEMALE' ? 'Chị dâu họ' : 'Anh rể họ';
      }

      // 9.6 Partner là cháu ruột của Tôi
      if (siblingIds.length > 0) {
        const isPartnerNephew = allRels.some(
          (r) =>
            r.type === 'PARENT_CHILD' &&
            r.childId === partner.id &&
            siblingIds.includes(r.parentId as string)
        );
        if (isPartnerNephew) {
          return target.gender === 'FEMALE' ? 'Cháu dâu' : 'Cháu rể';
        }
      }
    }
  }

  // 10. Cháu nội / Cháu ngoại (Con của con tôi)
  const isGrandchild = myChildIds.some((childId) =>
    allRels.some(
      (r) => r.type === 'PARENT_CHILD' && r.parentId === childId && r.childId === target.id
    )
  );
  if (isGrandchild) {
    const parentOfGrandchild = allPersons.find((p) =>
      allRels.some((r) => r.type === 'PARENT_CHILD' && r.parentId === p.id && r.childId === target.id)
    );
    if (parentOfGrandchild?.gender === 'MALE') {
      return target.gender === 'MALE' ? 'Cháu nội' : 'Cháu nội';
    } else {
      return target.gender === 'MALE' ? 'Cháu ngoại' : 'Cháu ngoại';
    }
  }

  // 11. Dựa theo Chênh lệch thế hệ (Generation Diff)
  const genDiff = (target.generation || 1) - (me.generation || 1);
  const isMale = target.gender === 'MALE';

  if (genDiff === 0) {
    // 11.1 Xác định vai vế Anh/Chị/Em họ dựa theo thứ bậc và năm sinh của thế hệ cha mẹ (theo truyền thống phả hệ Việt Nam)
    let targetParentIds = allRels
      .filter((r) => r.type === 'PARENT_CHILD' && r.childId === target.id && r.parentId)
      .map((r) => r.parentId as string);

    // Nếu target chưa có cha mẹ trực tiếp, thử tìm qua anh/chị/em ruột
    if (targetParentIds.length === 0) {
      const targetSiblings = allRels
        .filter(
          (r) =>
            r.type === 'SIBLING' &&
            ((r.spouse1Id === target.id && r.spouse2Id) || (r.spouse2Id === target.id && r.spouse1Id))
        )
        .map((r) => (r.spouse1Id === target.id ? r.spouse2Id! : r.spouse1Id!));

      for (const sibId of targetSiblings) {
        const sibParents = allRels
          .filter((r) => r.type === 'PARENT_CHILD' && r.childId === sibId && r.parentId)
          .map((r) => r.parentId as string);
        if (sibParents.length > 0) {
          targetParentIds = sibParents;
          break;
        }
      }
    }

    const targetParents = allPersons.filter((p) => targetParentIds.includes(p.id));

    for (const tParent of targetParents) {
      // Bên Nội: tParent là anh/chị/em ruột của Bố
      if (myFather) {
        const isFatherSibling =
          (paternalGrandparentIds.length > 0 &&
            allRels.some(
              (r) =>
                r.type === 'PARENT_CHILD' &&
                r.childId === tParent.id &&
                paternalGrandparentIds.includes(r.parentId as string)
            )) ||
          allRels.some(
            (r) =>
              r.type === 'SIBLING' &&
              ((r.spouse1Id === myFather.id && r.spouse2Id === tParent.id) ||
                (r.spouse2Id === myFather.id && r.spouse1Id === tParent.id))
          );

        if (isFatherSibling) {
          const yearTParent = getYearFromDate(tParent.birthDate);
          const yearMyFather = getYearFromDate(myFather.birthDate);

          // Nếu cả 2 đều đã cập nhật ngày tháng năm sinh -> so sánh chính xác vai vế theo năm sinh cha mẹ
          if (yearTParent !== null && yearMyFather !== null) {
            let isParentOlder = yearTParent < yearMyFather;
            if (yearTParent === yearMyFather && tParent.birthDate && myFather.birthDate) {
              const timeT = new Date(tParent.birthDate).getTime();
              const timeF = new Date(myFather.birthDate).getTime();
              if (!isNaN(timeT) && !isNaN(timeF) && timeT !== timeF) {
                isParentOlder = timeT < timeF;
              }
            }

            if (isParentOlder) {
              // Bác ruột (sinh trước Bố) -> Con là Anh họ / Chị họ
              return isMale ? 'Anh họ' : 'Chị họ';
            } else {
              // Chú/Cô ruột (sinh sau Bố) -> Con là Em họ
              return 'Em họ';
            }
          }

          // Nếu thiếu năm sinh: chỉ xác định nếu danh xưng hoặc biệt danh mang rõ vai vế bề trên (Bác / Bác Cả)
          const nickLower = (tParent.nickname || '').toLowerCase();
          const nameLower = (tParent.fullName || '').toLowerCase();
          if (nickLower.includes('bác') || nameLower.includes('bác') || nickLower.includes('cả')) {
            return isMale ? 'Anh họ' : 'Chị họ';
          }
          if (nickLower.includes('út') || nickLower.includes('em')) {
            return 'Em họ';
          }

          // Chưa có ngày tháng năm sinh của cha mẹ -> giữ trung tính
          return isMale ? 'Anh / Em họ' : 'Chị / Em họ';
        }
      }

      // Bên Ngoại: tParent là anh/chị/em ruột của Mẹ
      if (myMother) {
        const isMotherSibling =
          (maternalGrandparentIds.length > 0 &&
            allRels.some(
              (r) =>
                r.type === 'PARENT_CHILD' &&
                r.childId === tParent.id &&
                maternalGrandparentIds.includes(r.parentId as string)
            )) ||
          allRels.some(
            (r) =>
              r.type === 'SIBLING' &&
              ((r.spouse1Id === myMother.id && r.spouse2Id === tParent.id) ||
                (r.spouse2Id === myMother.id && r.spouse1Id === tParent.id))
          );

        if (isMotherSibling) {
          const yearTParent = getYearFromDate(tParent.birthDate);
          const yearMyMother = getYearFromDate(myMother.birthDate);

          if (yearTParent !== null && yearMyMother !== null) {
            let isParentOlder = yearTParent < yearMyMother;
            if (yearTParent === yearMyMother && tParent.birthDate && myMother.birthDate) {
              const timeT = new Date(tParent.birthDate).getTime();
              const timeM = new Date(myMother.birthDate).getTime();
              if (!isNaN(timeT) && !isNaN(timeM) && timeT !== timeM) {
                isParentOlder = timeT < timeM;
              }
            }

            if (isParentOlder) {
              return isMale ? 'Anh họ' : 'Chị họ';
            } else {
              return 'Em họ';
            }
          }

          const nickLower = (tParent.nickname || '').toLowerCase();
          const nameLower = (tParent.fullName || '').toLowerCase();
          if (nickLower.includes('bác') || nameLower.includes('bác') || nickLower.includes('cả')) {
            return isMale ? 'Anh họ' : 'Chị họ';
          }
          if (nickLower.includes('út') || nickLower.includes('em')) {
            return 'Em họ';
          }

          return isMale ? 'Anh / Em họ' : 'Chị / Em họ';
        }
      }
    }

    return isMale ? 'Anh / Em họ' : 'Chị / Em họ';
  } else if (genDiff === -1) {
    return isMale ? 'Bác họ' : 'Cô / Dì họ';
  } else if (genDiff === 1) {
    return isMale ? 'Cháu trai họ' : 'Cháu gái họ';
  } else if (genDiff === -2) {
    return isMale ? 'Cụ Ông' : 'Cụ Bà';
  } else if (genDiff === 2) {
    return isMale ? 'Cháu trai' : 'Cháu gái';
  } else if (genDiff === -3) {
    return isMale ? 'Cụ tổ (Cố)' : 'Cụ bà (Cố)';
  } else if (genDiff === 3) {
    return 'Chắt';
  } else if (genDiff <= -4) {
    return 'Thủy Tổ / Tiền Nhân';
  } else if (genDiff >= 4) {
    return 'Chút / Chít';
  }

  return 'Người thân';
}

/**
 * Phân loại chính xác danh sách ID thành viên thuộc Bên Nội và Bên Ngoại
 * Theo quy tắc phả hệ:
 * 1. Gia đình hạt nhân của Tôi (Tôi, Vợ/Chồng, Con cái, Cháu chắt nếu có):
 *    -> Luôn thuộc CẢ HAI BÊN (khi lọc Bên Nội hay Bên Ngoại đều hiển thị).
 * 2. Bên Nội:
 *    - Tính từ Cha của Tôi đi lên: Bố, Ông bà nội, Cụ cố nội...
 *    - Các con ruột của Ông bà nội (Anh chị em ruột của Bố - Bác/Chú/Cô) và vợ/chồng của họ.
 *    - Toàn bộ con cháu của họ (anh chị em họ bên nội, cháu họ nội...).
 *    - Anh chị em ruột của Tôi (cũng là con của Bố) và con cháu của họ.
 * 3. Bên Ngoại:
 *    - Tính từ Mẹ của Tôi đi lên: Mẹ, Ông bà ngoại, Cụ cố ngoại...
 *    - Các con ruột của Ông bà ngoại (Anh chị em ruột của Mẹ - Bác/Cậu/Dì) và vợ/chồng của họ.
 *    - Toàn bộ con cháu của họ (anh chị em họ bên ngoại, cháu họ ngoại...).
 *    - Anh chị em ruột của Tôi (cũng là con của Mẹ) và con cháu của họ.
 */
export function getPaternalMaternalMemberIds(
  me: Person | null | undefined,
  allPersons: Person[],
  allRels: Relationship[]
): { paternalMemberIds: Set<string>; maternalMemberIds: Set<string> } {
  const pSet = new Set<string>();
  const mSet = new Set<string>();

  if (!allPersons || allPersons.length === 0) {
    return { paternalMemberIds: pSet, maternalMemberIds: mSet };
  }

  // Xác định người quan sát trung tâm (me hoặc người định danh Tôi hoặc thế hệ 3 hoặc người đầu tiên)
  const targetMe =
    me ||
    allPersons.find((m) => m.nickname === 'Tôi' || m.nickname === 'Tôi (Khởi tạo)') ||
    allPersons.find((m) => m.generation === 3) ||
    allPersons[0];

  if (!targetMe) {
    allPersons.forEach((m) => {
      pSet.add(m.id);
      mSet.add(m.id);
    });
    return { paternalMemberIds: pSet, maternalMemberIds: mSet };
  }

  // Helper: Lấy tất cả con cháu hậu duệ đệ quy của 1 danh sách người
  const addAllDescendantsAndSpouses = (rootIds: string[], targetSet: Set<string>) => {
    const queue = [...rootIds];
    const visited = new Set<string>();
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);
      targetSet.add(currentId);

      // Thêm vợ/chồng của người này
      allRels.forEach((r) => {
        if (r.type === 'SPOUSE' && r.spouse1Id && r.spouse2Id) {
          if (r.spouse1Id === currentId) {
            targetSet.add(r.spouse2Id);
          } else if (r.spouse2Id === currentId) {
            targetSet.add(r.spouse1Id);
          }
        }
      });

      // Thêm con ruột của người này vào queue
      allRels.forEach((r) => {
        if (r.type === 'PARENT_CHILD' && r.parentId === currentId && r.childId) {
          queue.push(r.childId);
        }
      });

      // Thêm anh chị em ruột vào queue để bao quát toàn bộ nhánh con cháu (ví dụ: Bác Hoàng là anh ruột của Bố)
      allRels.forEach((r) => {
        if (r.type === 'SIBLING') {
          if (r.spouse1Id === currentId && r.spouse2Id) queue.push(r.spouse2Id);
          if (r.spouse2Id === currentId && r.spouse1Id) queue.push(r.spouse1Id);
        }
      });
    }
  };

  // Helper: Tìm tất cả tổ tiên tổ phụ (bố, mẹ, ông bà, cụ...) đi lên, luôn gom đủ cả vợ chồng (Ông & Bà)
  const getAncestors = (startId: string): string[] => {
    const ancestors = new Set<string>();
    const queue = [startId];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (!visited.has(curr)) {
        visited.add(curr);

        // 1. Tìm cha/mẹ trực tiếp
        allRels.forEach((r) => {
          if (r.type === 'PARENT_CHILD' && r.childId === curr && r.parentId) {
            ancestors.add(r.parentId);
            queue.push(r.parentId);

            // Tìm luôn vợ/chồng của cha/mẹ này (để luôn đủ cặp Ông & Bà)
            allRels.forEach((sp) => {
              if (sp.type === 'SPOUSE') {
                const partnerId =
                  sp.spouse1Id === r.parentId
                    ? sp.spouse2Id
                    : sp.spouse2Id === r.parentId
                    ? sp.spouse1Id
                    : null;
                if (partnerId && !ancestors.has(partnerId)) {
                  ancestors.add(partnerId);
                  queue.push(partnerId);
                }
              }
            });
          }
        });
      }
    }
    return Array.from(ancestors);
  };

  // 1. Tìm Cha và Mẹ trực tiếp của targetMe
  const myParents = allPersons.filter((p) =>
    allRels.some((r) => r.type === 'PARENT_CHILD' && r.parentId === p.id && r.childId === targetMe.id)
  );

  let myFather = myParents.find((p) => p.gender === 'MALE');
  let myMother = myParents.find((p) => p.gender === 'FEMALE');

  // Fallback nếu không gắn rõ giới tính
  if (myParents.length >= 1 && !myFather && !myMother) {
    myFather = myParents[0];
    if (myParents.length >= 2) myMother = myParents[1];
  }

  const myParentIdList = myParents.map((p) => p.id);

  // 2. Gia đình hạt nhân của Tôi: Tôi, vợ/chồng, anh chị em ruột, con cái, cháu chắt
  const nuclearIds = new Set<string>();
  nuclearIds.add(targetMe.id);

  // Tìm tất cả anh/chị/em ruột của Tôi (cùng cha hoặc cùng mẹ, hoặc nối quan hệ SIBLING)
  const directSiblingIds = allPersons
    .filter((p) => p.id !== targetMe.id)
    .filter((p) => {
      const sharesParent = allRels.some(
        (r) =>
          r.type === 'PARENT_CHILD' &&
          r.childId === p.id &&
          r.parentId &&
          myParentIdList.includes(r.parentId)
      );
      const isDirectSibling = allRels.some(
        (r) =>
          r.type === 'SIBLING' &&
          ((r.spouse1Id === targetMe.id && r.spouse2Id === p.id) ||
            (r.spouse2Id === targetMe.id && r.spouse1Id === p.id))
      );
      return sharesParent || isDirectSibling;
    })
    .map((p) => p.id);

  directSiblingIds.forEach((sibId) => nuclearIds.add(sibId));

  // Thêm vợ/chồng của Tôi và của anh/chị/em
  allRels.forEach((r) => {
    if (r.type === 'SPOUSE' && r.spouse1Id && r.spouse2Id) {
      if (nuclearIds.has(r.spouse1Id)) nuclearIds.add(r.spouse2Id);
      if (nuclearIds.has(r.spouse2Id)) nuclearIds.add(r.spouse1Id);
    }
  });

  // Thêm toàn bộ con cháu hậu duệ của Tôi và của anh/chị/em
  addAllDescendantsAndSpouses(Array.from(nuclearIds), nuclearIds);

  // Gia đình hạt nhân luôn thuộc cả Bên Nội và Bên Ngoại
  nuclearIds.forEach((id) => {
    pSet.add(id);
    mSet.add(id);
  });

  // 3. Xử lý BÊN NỘI: Tính từ Cha của Tôi ra
  if (myFather) {
    pSet.add(myFather.id);

    // Vợ của Bố (Mẹ hoặc Mẹ kế) trong gia đình Bố
    allRels.forEach((r) => {
      if (r.type === 'SPOUSE') {
        if (r.spouse1Id === myFather!.id && r.spouse2Id) pSet.add(r.spouse2Id);
        if (r.spouse2Id === myFather!.id && r.spouse1Id) pSet.add(r.spouse1Id);
      }
    });

    // Thêm toàn bộ con cháu của Bố vào Bên Nội (đảm bảo Tôi và anh chị em ruột luôn có mặt)
    addAllDescendantsAndSpouses([myFather.id], pSet);

    // Lấy toàn bộ tổ phụ của Bố: Luôn gồm đầy đủ cả Ông Nội & Bà Nội, Cụ ông & Cụ bà
    const fatherAncestors = getAncestors(myFather.id);
    fatherAncestors.forEach((ancId) => pSet.add(ancId));

    // Quét và vẽ ra toàn bộ các anh/chị/em ruột của Bố (các bác, chú, cô bên nội)
    const fatherSiblings = new Set<string>();
    // a. Qua các tổ phụ chung (con của ông/bà nội)
    fatherAncestors.forEach((ancId) => {
      allRels.forEach((r) => {
        if (r.type === 'PARENT_CHILD' && r.parentId === ancId && r.childId && r.childId !== myFather!.id) {
          fatherSiblings.add(r.childId);
        }
      });
    });
    // b. Qua quan hệ SIBLING trực tiếp với Bố
    allRels.forEach((r) => {
      if (r.type === 'SIBLING') {
        if (r.spouse1Id === myFather!.id && r.spouse2Id) fatherSiblings.add(r.spouse2Id);
        if (r.spouse2Id === myFather!.id && r.spouse1Id) fatherSiblings.add(r.spouse1Id);
      }
    });

    // Thêm các anh chị em ruột của Bố và toàn bộ gia đình con cháu họ vào nhánh Nội
    fatherSiblings.forEach((sibId) => {
      pSet.add(sibId);
      addAllDescendantsAndSpouses([sibId], pSet);
    });

    // Đảm bảo lan truyền con cháu từ các tổ tiên cao nhất bên nội
    const topAncestors = fatherAncestors.length > 0 ? fatherAncestors : [myFather.id];
    topAncestors.forEach((ancId) => {
      addAllDescendantsAndSpouses([ancId], pSet);
    });
  }

  // 4. Xử lý BÊN NGOẠI: Tính từ Mẹ của Tôi ra
  if (myMother) {
    mSet.add(myMother.id);

    // Chồng của Mẹ trong gia đình Mẹ
    allRels.forEach((r) => {
      if (r.type === 'SPOUSE') {
        if (r.spouse1Id === myMother!.id && r.spouse2Id) mSet.add(r.spouse2Id);
        if (r.spouse2Id === myMother!.id && r.spouse1Id) mSet.add(r.spouse1Id);
      }
    });

    // Thêm toàn bộ con cháu của Mẹ vào Bên Ngoại (đảm bảo Tôi và anh chị em ruột luôn có mặt)
    addAllDescendantsAndSpouses([myMother.id], mSet);

    // Lấy toàn bộ tổ phụ của Mẹ: Luôn gồm đầy đủ cả Ông Ngoại & Bà Ngoại, Cụ ông & Cụ bà ngoại
    const motherAncestors = getAncestors(myMother.id);
    motherAncestors.forEach((ancId) => mSet.add(ancId));

    // Quét và vẽ ra toàn bộ các anh/chị/em ruột của Mẹ (các bác, cậu, dì bên ngoại)
    const motherSiblings = new Set<string>();
    // a. Qua các tổ phụ chung (con của ông/bà ngoại)
    motherAncestors.forEach((ancId) => {
      allRels.forEach((r) => {
        if (r.type === 'PARENT_CHILD' && r.parentId === ancId && r.childId && r.childId !== myMother!.id) {
          motherSiblings.add(r.childId);
        }
      });
    });
    // b. Qua quan hệ SIBLING trực tiếp với Mẹ
    allRels.forEach((r) => {
      if (r.type === 'SIBLING') {
        if (r.spouse1Id === myMother!.id && r.spouse2Id) motherSiblings.add(r.spouse2Id);
        if (r.spouse2Id === myMother!.id && r.spouse1Id) motherSiblings.add(r.spouse1Id);
      }
    });

    // Thêm các anh chị em ruột của Mẹ và toàn bộ gia đình con cháu họ vào nhánh Ngoại
    motherSiblings.forEach((sibId) => {
      mSet.add(sibId);
      addAllDescendantsAndSpouses([sibId], mSet);
    });

    // Đảm bảo lan truyền con cháu từ các tổ tiên cao nhất bên ngoại
    const topAncestors = motherAncestors.length > 0 ? motherAncestors : [myMother.id];
    topAncestors.forEach((ancId) => {
      addAllDescendantsAndSpouses([ancId], mSet);
    });
  }

  // 5. Nếu cây chưa có bố mẹ được nối chính thức (hoặc cây độc lập), đảm bảo không bị rỗng
  if (!myFather && !myMother) {
    allPersons.forEach((m) => {
      pSet.add(m.id);
      mSet.add(m.id);
    });
  }

  // 6. ĐẢM BẢO TÍNH TOÀN VẸN CẶP ĐÔI (Couples Integrity Rule):
  // Tuyệt đối không để tình trạng một người có mặt nhưng thiếu người bạn đời (vợ/chồng).
  // Đời ông bà phải luôn hiển thị cả đôi (Ông Nội & Bà Nội, Ông Ngoại & Bà Ngoại).
  let changed = true;
  let iterations = 0;
  while (changed && iterations < 10) {
    changed = false;
    iterations++;
    allRels.forEach((r) => {
      if (r.type === 'SPOUSE' && r.spouse1Id && r.spouse2Id) {
        // Bên Nội
        if (pSet.has(r.spouse1Id) && !pSet.has(r.spouse2Id)) {
          pSet.add(r.spouse2Id);
          changed = true;
        } else if (pSet.has(r.spouse2Id) && !pSet.has(r.spouse1Id)) {
          pSet.add(r.spouse1Id);
          changed = true;
        }

        // Bên Ngoại
        if (mSet.has(r.spouse1Id) && !mSet.has(r.spouse2Id)) {
          mSet.add(r.spouse2Id);
          changed = true;
        } else if (mSet.has(r.spouse2Id) && !mSet.has(r.spouse1Id)) {
          mSet.add(r.spouse1Id);
          changed = true;
        }
      }
    });
  }

  return { paternalMemberIds: pSet, maternalMemberIds: mSet };
}
