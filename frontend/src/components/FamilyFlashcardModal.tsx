import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Sparkles,
  Trophy,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  User,
  ArrowRight,
  Flame,
  UserPlus
} from 'lucide-react';
import { FamilyTree, Person } from '../types';
import { generateFamilyQuiz, QuizQuestion } from '../utils/flashcardGenerator';
import { getInitials } from '../utils/formatHelper';

interface FamilyFlashcardModalProps {
  tree: FamilyTree;
  mePerson: Person | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenAddMember?: () => void;
}

export const FamilyFlashcardModal: React.FC<FamilyFlashcardModalProps> = ({
  tree,
  mePerson,
  isOpen,
  onClose,
  onOpenAddMember,
}) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [streak, setStreak] = useState<number>(0);

  // Khởi tạo bộ câu hỏi khi mở modal
  const initQuiz = () => {
    const list = generateFamilyQuiz(tree, mePerson);
    setQuestions(list);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setStreak(0);
    setIsCompleted(false);
  };

  useEffect(() => {
    if (isOpen) {
      initQuiz();
    }
  }, [isOpen, tree, mePerson]);

  const currentQ = useMemo(() => {
    return questions[currentIndex] || null;
  }, [questions, currentIndex]);

  const handleSelectOption = (option: string) => {
    if (isAnswered || !currentQ) return;
    setSelectedOption(option);
    setIsAnswered(true);

    if (option === currentQ.correctAnswer) {
      setScore((prev) => prev + 1);
      setStreak((prev) => prev + 1);
    } else {
      setStreak(0);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsCompleted(true);
    }
  };

  if (!isOpen) return null;

  // Trường hợp cây có dưới 4 người
  if (!tree.members || tree.members.length < 4) {
    return (
      <div className="flashcard-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
        <div className="flashcard-modal-container" onClick={(e) => e.stopPropagation()}>
          <div className="flashcard-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div className="flashcard-badge-icon" style={{ background: '#f59e0b22', color: '#f59e0b' }}>
                <Sparkles size={20} />
              </div>
              <h2 className="flashcard-title">Đố Vui Gia Phả</h2>
            </div>
            <button type="button" className="flashcard-close-btn" onClick={onClose} aria-label="Đóng">
              <X size={20} />
            </button>
          </div>

          <div className="flashcard-empty-state">
            <div className="flashcard-empty-icon">
              <HelpCircle size={48} color="#10b981" />
            </div>
            <h3 style={{ fontSize: '1.25rem', color: '#f8fafc', marginBottom: '0.5rem', fontWeight: 700 }}>
              Chưa Đủ Thành Viên Để Chơi
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '380px', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Cây gia phả hiện có <strong>{tree.members?.length || 0}</strong> thành viên. Để tạo câu hỏi trắc nghiệm 4 đáp án thú vị, hệ thống cần tối thiểu <strong>4 người thân</strong> trong cây.
            </p>
            {onOpenAddMember && (
              <button
                type="button"
                className="flashcard-btn-primary"
                onClick={() => {
                  onClose();
                  onOpenAddMember();
                }}
              >
                <UserPlus size={18} />
                <span>+ Thêm Người Thân Vào Cây</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flashcard-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="flashcard-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="flashcard-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div className="flashcard-badge-icon">
              <Sparkles size={20} color="#a855f7" />
            </div>
            <div>
              <h2 className="flashcard-title">Đố Vui Gia Phả (Ai Là Ai?)</h2>
              <span className="flashcard-subtitle">
                {!isCompleted && questions.length > 0
                  ? `Câu hỏi ${currentIndex + 1} / ${questions.length}`
                  : 'Kết quả thử thách'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {streak > 1 && !isCompleted && (
              <div className="flashcard-streak-pill" title="Chuỗi trả lời đúng liên tiếp!">
                <Flame size={15} color="#f97316" />
                <span>Chuỗi {streak}🔥</span>
              </div>
            )}
            <button type="button" className="flashcard-close-btn" onClick={onClose} aria-label="Đóng">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* PROGRESS BAR */}
        {!isCompleted && questions.length > 0 && (
          <div className="flashcard-progress-track">
            <div
              className="flashcard-progress-bar"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        )}

        {/* BODY */}
        <div className="flashcard-body">
          {isCompleted ? (
            /* SUMMARY SCREEN */
            <div className="flashcard-result-screen">
              <div className="flashcard-trophy-box">
                <Trophy size={54} color="#fbbf24" />
              </div>
              <h3 className="flashcard-result-title">
                {score === questions.length
                  ? 'Tuyệt Vời! Bạn Là Chuyên Gia Gia Phả 🌟'
                  : score >= Math.ceil(questions.length * 0.7)
                  ? 'Rất Tốt! Bạn Rất Nhớ Người Thân 👏'
                  : 'Hoàn Thành Thử Thách! Cùng Ôn Lại Nhé 💪'}
              </h3>
              <p className="flashcard-result-desc">
                Bạn đã trả lời đúng <strong>{score}</strong> / <strong>{questions.length}</strong> câu hỏi.
              </p>

              <div className="flashcard-stats-row">
                <div className="flashcard-stat-card">
                  <span className="stat-value">{Math.round((score / (questions.length || 1)) * 100)}%</span>
                  <span className="stat-label">Chính xác</span>
                </div>
                <div className="flashcard-stat-card">
                  <span className="stat-value">{score}</span>
                  <span className="stat-label">Câu đúng</span>
                </div>
                <div className="flashcard-stat-card">
                  <span className="stat-value">{questions.length - score}</span>
                  <span className="stat-label">Câu chưa đúng</span>
                </div>
              </div>

              <div className="flashcard-result-actions">
                <button type="button" className="flashcard-btn-primary" onClick={initQuiz}>
                  <RotateCcw size={18} />
                  <span>Chơi Lại Bộ Khác</span>
                </button>
                <button type="button" className="flashcard-btn-secondary" onClick={onClose}>
                  <span>Đóng Lại</span>
                </button>
              </div>
            </div>
          ) : currentQ ? (
            /* ACTIVE QUESTION VIEW */
            <div className="flashcard-quiz-wrapper">
              {/* Question Card */}
              <div className="flashcard-question-card">
                <div className="flashcard-avatar-pill">
                  {currentQ.targetPerson.avatarUrl ? (
                    <img
                      src={currentQ.targetPerson.avatarUrl}
                      alt={currentQ.targetPerson.fullName}
                      className="question-avatar-img"
                    />
                  ) : (
                    <div className="question-avatar-fallback">
                      {getInitials(currentQ.targetPerson.fullName)}
                    </div>
                  )}
                </div>

                <div className="flashcard-prompt-group">
                  {currentQ.badgeHint && (
                    <span className="flashcard-badge-hint">{currentQ.badgeHint}</span>
                  )}
                  <h3 className="flashcard-question-text">{currentQ.promptTitle}</h3>
                  <p className="flashcard-prompt-sub">{currentQ.promptDescription}</p>
                </div>
              </div>

              {/* 4 Options Grid */}
              <div className="flashcard-options-grid">
                {currentQ.options.map((option, idx) => {
                  const isSelected = selectedOption === option;
                  const isCorrect = option === currentQ.correctAnswer;
                  let btnStateClass = '';

                  if (isAnswered) {
                    if (isCorrect) {
                      btnStateClass = 'correct-opt';
                    } else if (isSelected) {
                      btnStateClass = 'wrong-opt';
                    } else {
                      btnStateClass = 'disabled-opt';
                    }
                  }

                  const labels = ['A', 'B', 'C', 'D'];

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isAnswered}
                      className={`flashcard-option-btn ${btnStateClass}`}
                      onClick={() => handleSelectOption(option)}
                    >
                      <span className="opt-letter">{labels[idx]}</span>
                      <span className="opt-text">{option}</span>
                      {isAnswered && isCorrect && (
                        <CheckCircle2 size={18} color="#34d399" className="opt-status-icon" />
                      )}
                      {isAnswered && isSelected && !isCorrect && (
                        <XCircle size={18} color="#f87171" className="opt-status-icon" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Answer Explanation & Next Button */}
              {isAnswered && (
                <div className="flashcard-footer-action">
                  <div className="flashcard-explanation-box">
                    <p>
                      <strong>Giải thích:</strong> {currentQ.explanation}
                    </p>
                  </div>
                  <button type="button" className="flashcard-next-btn" onClick={handleNextQuestion}>
                    <span>
                      {currentIndex + 1 < questions.length ? 'Câu Tiếp Theo' : 'Xem Kết Quả'}
                    </span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
