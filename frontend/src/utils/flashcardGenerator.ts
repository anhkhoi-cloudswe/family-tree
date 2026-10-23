import { FamilyTree, Person } from '../types';
import { getKinshipToMe } from './kinshipHelper';
import { formatDateVN } from './dateHelper';

export interface QuizQuestion {
  id: string;
  type: 'KINSHIP_TO_NAME' | 'NAME_TO_KINSHIP' | 'NICKNAME_OR_YEAR' | 'GENERATION_BRANCH';
  targetPerson: Person;
  promptTitle: string;
  promptDescription: string;
  badgeHint?: string;
  correctAnswer: string;
  options: string[]; // Always 4 options
  explanation: string;
}

/**
 * Xáo trộn mảng ngẫu nhiên (Fisher-Yates)
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Lấy danh sách 3 đáp án sai không trùng với đáp án đúng
 */
function getDistractors(correct: string, candidatePool: string[]): string[] {
  const uniquePool = Array.from(new Set(candidatePool.filter((c) => c && c.trim() !== '' && c !== correct)));
  const shuffled = shuffleArray(uniquePool);
  
  // Nếu không đủ 3 phương án từ pool, bổ sung các danh từ xưng hô / tên mẫu
  const fallbackList = [
    'Bác ruột', 'Chú ruột', 'Cô ruột', 'Cậu ruột', 'Dì ruột',
    'Ông nội', 'Bà nội', 'Ông ngoại', 'Bà ngoại',
    'Anh trai', 'Chị gái', 'Em trai', 'Em gái',
    'Bác dâu', 'Thím', 'Mợ', 'Dượng'
  ];
  const combined = [...shuffled];
  for (const item of fallbackList) {
    if (combined.length >= 3) break;
    if (item !== correct && !combined.includes(item)) {
      combined.push(item);
    }
  }
  return combined.slice(0, 3);
}

/**
 * Tạo danh sách câu hỏi Flashcard thông minh từ Cây Gia Phả
 */
export function generateFamilyQuiz(tree: FamilyTree, mePerson: Person | null): QuizQuestion[] {
  if (!tree || !tree.members || tree.members.length < 4) {
    return [];
  }

  const members = tree.members;
  const questions: QuizQuestion[] = [];
  const allNames = members.map((m) => m.fullName);

  // Tính số lượng câu hỏi phù hợp
  let targetCount = 5;
  if (members.length >= 8 && members.length <= 15) {
    targetCount = 10;
  } else if (members.length > 15) {
    targetCount = 15;
  }

  // Danh sách các vai vế trong cây đối với "Tôi"
  const memberKinships = new Map<string, string>();
  members.forEach((m) => {
    const k = getKinshipToMe(mePerson, m, members, tree.relationships);
    memberKinships.set(m.id, k);
  });
  const allKinships = Array.from(new Set(Array.from(memberKinships.values())));

  // Xáo trộn danh sách thành viên để làm ứng viên câu hỏi
  const candidates = shuffleArray(members);

  for (const person of candidates) {
    if (questions.length >= targetCount) break;

    const kinship = memberKinships.get(person.id) || 'Người thân';
    const isMe = mePerson && person.id === mePerson.id;

    // 1. Dạng KINSHIP_TO_NAME: Đoán tên người dựa vào vai vế
    if (!isMe && kinship !== 'Người thân' && kinship !== 'Tôi') {
      const distractors = getDistractors(person.fullName, allNames);
      if (distractors.length >= 3) {
        const options = shuffleArray([person.fullName, ...distractors]);
        questions.push({
          id: `q_kin_${person.id}_${questions.length}`,
          type: 'KINSHIP_TO_NAME',
          targetPerson: person,
          promptTitle: `Ai là "${kinship}" của bạn?`,
          promptDescription: `Trong gia phả dòng họ, người có vai vế xưng hô là "${kinship}" đối với bạn tên là gì?`,
          badgeHint: kinship,
          correctAnswer: person.fullName,
          options,
          explanation: `${person.fullName} là ${kinship} đối với bạn trong cây gia phả.`,
        });
        if (questions.length >= targetCount) break;
      }
    }

    // 2. Dạng NAME_TO_KINSHIP: Đoán vai vế dựa vào tên người
    if (!isMe && kinship !== 'Người thân' && kinship !== 'Tôi') {
      const distractors = getDistractors(kinship, allKinships);
      if (distractors.length >= 3) {
        const options = shuffleArray([kinship, ...distractors]);
        questions.push({
          id: `q_name_${person.id}_${questions.length}`,
          type: 'NAME_TO_KINSHIP',
          targetPerson: person,
          promptTitle: `"${person.fullName}" có vai vế gì với bạn?`,
          promptDescription: `Khi xưng hô theo góc nhìn của bạn, ${person.fullName} được gọi chuẩn xác là:`,
          badgeHint: person.fullName,
          correctAnswer: kinship,
          options,
          explanation: `Theo phả hệ gia đình, bạn gọi ${person.fullName} là "${kinship}".`,
        });
        if (questions.length >= targetCount) break;
      }
    }

    // 3. Dạng NICKNAME_OR_YEAR: Đoán theo Biệt danh hoặc Năm sinh
    if (person.nickname && person.nickname.trim() !== '' && person.nickname.toLowerCase() !== 'tôi') {
      const distractors = getDistractors(person.fullName, allNames);
      if (distractors.length >= 3) {
        const options = shuffleArray([person.fullName, ...distractors]);
        questions.push({
          id: `q_nick_${person.id}_${questions.length}`,
          type: 'NICKNAME_OR_YEAR',
          targetPerson: person,
          promptTitle: `Ai có tên thân mật là "${person.nickname}"?`,
          promptDescription: `Người thân nào trong dòng họ thường được gọi với biệt danh hoặc tên thân mật "${person.nickname}"?`,
          badgeHint: person.nickname,
          correctAnswer: person.fullName,
          options,
          explanation: `${person.fullName} có tên gọi/biệt danh thân mật là "${person.nickname}".`,
        });
        if (questions.length >= targetCount) break;
      }
    } else if (person.birthDate) {
      const birthStr = formatDateVN(person.birthDate);
      const distractors = getDistractors(person.fullName, allNames);
      if (distractors.length >= 3) {
        const options = shuffleArray([person.fullName, ...distractors]);
        questions.push({
          id: `q_birth_${person.id}_${questions.length}`,
          type: 'NICKNAME_OR_YEAR',
          targetPerson: person,
          promptTitle: `Ai có ngày sinh ${birthStr}?`,
          promptDescription: `Thành viên nào trong phả hệ sinh vào ngày ${birthStr}?`,
          badgeHint: birthStr,
          correctAnswer: person.fullName,
          options,
          explanation: `${person.fullName} sinh ngày ${birthStr}.`,
        });
        if (questions.length >= targetCount) break;
      }
    }
  }

  return questions;
}
