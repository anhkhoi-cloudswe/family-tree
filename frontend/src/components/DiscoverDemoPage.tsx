import React, { useState } from 'react';
import { ArrowLeft, LogIn, Sparkles, Eye, ShieldCheck, TreePine, Info } from 'lucide-react';
import { FamilyTreeLogo } from './FamilyTreeLogo';
import { TreeCanvas } from './TreeCanvas';
import { MemberDetailDrawer } from './MemberDetailDrawer';
import { sampleDiscoverTree } from '../demo/sampleDiscoverTree';
import { Person } from '../types';

interface DiscoverDemoPageProps {
  onBackToHome: () => void;
  onOpenLogin: () => void;
}

export const DiscoverDemoPage: React.FC<DiscoverDemoPageProps> = ({
  onBackToHome,
  onOpenLogin,
}) => {
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [branchFilter, setBranchFilter] = useState<'ALL' | 'PATERNAL' | 'MATERNAL'>('ALL');
  const [viewMode, setViewMode] = useState<'COMPACT' | 'DETAILED'>('COMPACT');
  const [focusPersonId, setFocusPersonId] = useState<string | null>(null);

  const mePerson = sampleDiscoverTree.members.find((m) => m.id === 'd-gen3-khoi') || null;

  return (
    <div className="min-h-screen h-[100dvh] w-full flex flex-col bg-[#070e09] text-slate-100 overflow-hidden relative">
      {/* 1. Header Đồng Bộ Phong Cách Landing Page */}
      <header className="h-16 sm:h-20 bg-[#0b160f]/95 border-b border-[#273f2b] px-4 sm:px-6 flex items-center justify-between gap-4 z-40 shrink-0">
        {/* Left: Back button & Logo */}
        <div className="flex items-center gap-3 sm:gap-5">
          <button
            type="button"
            onClick={onBackToHome}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold text-[#d0d7c0] hover:text-white bg-[#122314] hover:bg-[#1a331d] border border-[#273f2b] transition-all cursor-pointer"
            title="Quay lại trang chủ"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Trang Chủ</span>
          </button>

          <div
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group"
            onClick={onBackToHome}
          >
            <FamilyTreeLogo size={34} />
            <div className="flex items-baseline">
              <span className="text-lg sm:text-xl font-bold font-serif tracking-wider text-white group-hover:text-[#68ef3f] transition-colors">
                Famlykin
              </span>
              <span className="ml-2 text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-[#122314] text-[#68ef3f] border border-[#273f2b] font-medium flex items-center gap-1">
                <Sparkles size={11} />
                <span>Cây Mẫu Trải Nghiệm</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: CTA Đăng Nhập */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenLogin}
            className="px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold text-[#122314] bg-[#68ef3f] hover:bg-[#58dc31] shadow-[0_0_20px_rgba(104,239,63,0.35)] transition-all transform hover:-translate-y-0.5 cursor-pointer whitespace-nowrap flex items-center gap-1.5"
          >
            <span>Đăng Nhập</span>
            <LogIn size={15} />
          </button>
        </div>
      </header>

      {/* 2. Banner Thông Báo Chế Độ Chỉ Xem Mẫu */}
      <div className="bg-[#122314]/90 border-b border-[#273f2b] px-4 py-2 text-xs text-[#d0d7c0] flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 mx-auto text-center">
          <Info size={15} className="text-[#68ef3f] shrink-0" />
          <span>
            Bạn đang xem sơ đồ phả hệ mẫu minh họa: <strong className="text-white">Gia phả Dòng họ Nguyễn (4 thế hệ)</strong>. 
            Bạn có thể phóng to, thu nhỏ, kéo canvas hoặc bấm vào thành viên để xem chi tiết.
          </span>
        </div>
      </div>

      {/* 3. Tree Canvas Container */}
      <main className="flex-1 min-h-0 relative w-full overflow-hidden">
        <TreeCanvas
          tree={sampleDiscoverTree}
          mePerson={mePerson}
          branchFilter={branchFilter}
          onBranchFilterChange={setBranchFilter}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onSelectPerson={(p) => setSelectedPerson(p)}
          exportTrigger={0}
          onExportDone={() => {}}
          focusPersonId={focusPersonId}
          onClearFocusPerson={() => setFocusPersonId(null)}
          isPro={true}
        />
      </main>

      {/* 4. Chi tiết thành viên ở chế độ Read-only */}
      {selectedPerson && (
        <MemberDetailDrawer
          person={selectedPerson}
          tree={sampleDiscoverTree}
          mePerson={mePerson}
          onClose={() => setSelectedPerson(null)}
          onSelectPerson={(p) => setSelectedPerson(p)}
          readOnly={true}
        />
      )}
    </div>
  );
};
