import React, { useState, useEffect } from 'react';
import { X, Sparkles, ArrowRight, Compass, Users } from 'lucide-react';
import { Person, FamilyTree, KinshipResult } from '../types';
import { apiCalculateKinship } from '../services/api';

interface KinshipCalculatorModalProps {
  tree: FamilyTree;
  preselectedPerson: Person | null;
  onClose: () => void;
}

export const KinshipCalculatorModal: React.FC<KinshipCalculatorModalProps> = ({
  tree,
  preselectedPerson,
  onClose,
}) => {
  const [personAId, setPersonAId] = useState<string>('');
  const [personBId, setPersonBId] = useState<string>('');
  const [result, setResult] = useState<KinshipResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tree.members.length >= 2) {
      if (preselectedPerson) {
        setPersonBId(preselectedPerson.id);
        const other = tree.members.find((m) => m.id !== preselectedPerson.id);
        if (other) setPersonAId(other.id);
      } else {
        setPersonAId(tree.members[0].id);
        setPersonBId(tree.members[1].id);
      }
    }
  }, [tree, preselectedPerson]);

  const handleCalculate = async () => {
    if (!personAId || !personBId) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiCalculateKinship(tree.id, personAId, personBId);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tính toán xưng hô');
    } finally {
      setIsLoading(false);
    }
  };

  // Run calculation when person IDs change
  useEffect(() => {
    if (personAId && personBId) {
      handleCalculate();
    }
  }, [personAId, personBId]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div
          style={{
            padding: '1.2rem 1.5rem',
            borderBottom: '1px solid var(--border-gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Sparkles size={22} color="#f1c40f" />
            <h3 className="font-title" style={{ fontSize: '1.15rem', color: '#f3e5ab' }}>
              TRA CỨU VAI VẾ & XƯNG HÔ DÒNG TỘC
            </h3>
          </div>
          <button className="btn-ghost" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          <p style={{ fontSize: '0.85rem', color: '#bda89b', marginBottom: '1.2rem' }}>
            Chọn 2 người bất kỳ trong cây gia phả. Hệ thống sẽ tự động dò tìm chuỗi quan hệ huyết
            thống, xác định chênh lệch thế hệ và đưa ra cách xưng hô chuẩn mực truyền thống Việt
            Nam.
          </p>

          {/* Selectors */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              gap: '0.8rem',
              alignItems: 'center',
              marginBottom: '1.5rem',
            }}
          >
            <div>
              <label className="form-label">Người thứ nhất (A)</label>
              <select
                className="form-select"
                value={personAId}
                onChange={(e) => setPersonAId(e.target.value)}
              >
                {tree.members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} (Đời {m.generation})
                  </option>
                ))}
              </select>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: '1.2rem',
                color: '#d4af37',
              }}
            >
              <ArrowRight size={20} />
            </div>

            <div>
              <label className="form-label">Người thứ hai (B)</label>
              <select
                className="form-select"
                value={personBId}
                onChange={(e) => setPersonBId(e.target.value)}
              >
                {tree.members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} (Đời {m.generation})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results display */}
          {isLoading && (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: '#d4af37' }}>
              Đang phân tích cây gia phả...
            </div>
          )}

          {error && (
            <div style={{ color: '#e74c3c', fontSize: '0.85rem', padding: '1rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          {result && !isLoading && (
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(38, 28, 22, 0.9) 0%, rgba(26, 19, 14, 0.95) 100%)',
                border: '1.5px solid var(--border-gold)',
                borderRadius: '12px',
                padding: '1.4rem',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: '#d4af37',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    fontWeight: 600,
                  }}
                >
                  KẾT QUẢ XƯNG HÔ CHUẨN MỰC
                </span>
                <h4
                  className="font-heritage"
                  style={{
                    fontSize: '1.5rem',
                    color: '#f3e5ab',
                    margin: '0.3rem 0',
                  }}
                >
                  {result.kinshipTitle}
                </h4>
                <div
                  style={{
                    display: 'inline-block',
                    padding: '0.3rem 0.9rem',
                    background: 'rgba(212, 175, 55, 0.15)',
                    border: '1px solid rgba(212, 175, 55, 0.35)',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    color: '#fff',
                    fontWeight: 500,
                  }}
                >
                  {result.addressing}
                </div>
              </div>

              {/* Generation diff note */}
              <div
                style={{
                  fontSize: '0.82rem',
                  color: '#bda89b',
                  borderTop: '1px solid rgba(212, 175, 55, 0.2)',
                  paddingTop: '0.8rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>Chênh lệch thế hệ:</span>
                <strong style={{ color: '#d4af37' }}>
                  {result.generationDiff === 0
                    ? 'Cùng thế hệ'
                    : result.generationDiff > 0
                    ? `Thế hệ trên (+${result.generationDiff} đời)`
                    : `Thế hệ dưới (${result.generationDiff} đời)`}
                </strong>
              </div>

              {/* Path breakdown */}
              {result.pathDescription && result.pathDescription.length > 0 && (
                <div style={{ marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px dashed rgba(212, 175, 55, 0.2)' }}>
                  <span style={{ fontSize: '0.78rem', color: '#e6ca65', fontWeight: 600 }}>
                    Đường dẫn liên kết trong phả hệ:
                  </span>
                  <div style={{ marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    {result.pathDescription.map((step, idx) => (
                      <span key={idx} style={{ fontSize: '0.78rem', color: '#f8f6f0' }}>
                        {step}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer close */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button className="btn-gold" onClick={onClose}>
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
