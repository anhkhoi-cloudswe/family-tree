import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mail, Sparkles } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { TreeCanvas } from './components/TreeCanvas';
import { MemberListView } from './components/MemberListView';
import { MemberDetailDrawer } from './components/MemberDetailDrawer';
import { AddMemberModal } from './components/AddMemberModal';
import { LunarAnniversaryModal } from './components/LunarAnniversaryModal';
import { ReminderSettingsModal } from './components/ReminderSettingsModal';
import { AuthModal } from './components/AuthModal';
import { PersonPickerModal } from './components/PersonPickerModal';
import { HelpModal } from './components/HelpModal';
import { AdminModal } from './components/AdminModal';
import { OnboardingTour } from './components/OnboardingTour';
import { QuickOnboardingModal } from './components/QuickOnboardingModal';
import { FamilyFlashcardModal } from './components/FamilyFlashcardModal';
import { ToastProvider, useToast } from './components/Toast';
import { User, FamilyTree, Person } from './types';
import {
  ReminderSettings,
  getStoredReminderSettings,
  saveReminderSettings,
  parseDayMonth,
  calculateDaysLeftAnnual,
} from './utils/dateHelper';
import { calculateAnniversaryStatus } from './utils/lunarHelper';
import {
  apiGetMe,
  apiGetTrees,
  apiGetTreeById,
  apiCreateTree,
  apiCreatePerson,
  apiMagicLogin,
  getStoredToken,
  setStoredToken,
  removeStoredToken,
} from './services/api';
import {
  isFirebaseEmailLink,
  getEmailFromUrlOrStorage,
  completeFirebaseSignIn,
} from './services/firebase';

const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [tree, setTree] = useState<FamilyTree | null>(null);
  const [mePerson, setMePerson] = useState<Person | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // Magic Link Confirmation states for cross-device/cross-browser
  const [showMagicLinkPrompt, setShowMagicLinkPrompt] = useState<boolean>(false);
  const [magicLinkEmail, setMagicLinkEmail] = useState<string>('');
  const [isSubmittingMagicLink, setIsSubmittingMagicLink] = useState<boolean>(false);
  const [magicLinkError, setMagicLinkError] = useState<string | null>(null);

  // Main View: Sơ đồ Cây (TREE) or Danh Bạ Thu Gọn (LIST)
  const [mainView, setMainView] = useState<'TREE' | 'LIST'>('TREE');

  // Modals & Drawer states
  const [drawerPerson, setDrawerPerson] = useState<Person | null>(null);
  const [addMemberTarget, setAddMemberTarget] = useState<Person | null>(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState<boolean>(false);
  const [showLunarModal, setShowLunarModal] = useState<boolean>(false);
  const [showReminderModal, setShowReminderModal] = useState<boolean>(false);
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(getStoredReminderSettings);
  const [showPersonPicker, setShowPersonPicker] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [showTour, setShowTour] = useState<boolean>(false);
  const [showQuickOnboarding, setShowQuickOnboarding] = useState<boolean>(false);
  const [showFlashcardModal, setShowFlashcardModal] = useState<boolean>(false);

  // Filters & View Mode
  const [branchFilter, setBranchFilter] = useState<'ALL' | 'PATERNAL' | 'MATERNAL'>('ALL');
  const [viewMode, setViewMode] = useState<'COMPACT' | 'DETAILED'>('DETAILED');
  const [focusPersonId, setFocusPersonId] = useState<string | null>(null);

  // Image Export state
  const [exportTrigger, setExportTrigger] = useState<number>(0);
  const [isExportingImage, setIsExportingImage] = useState<boolean>(false);

  const toast = useToast();

  // Function to scan tree and trigger subtle toast notice for upcoming birthdays or anniversaries
  const checkUpcomingReminders = useCallback((currentTree: FamilyTree, settings: ReminderSettings) => {
    if (!settings.enabled || !currentTree.members || currentTree.members.length === 0) return;
    const daysToScan = Math.max(1, settings.advanceDays); // Mặc định luôn là 1 ngày nếu người dùng chưa chỉnh

    let upcomingCount = 0;
    const matches: string[] = [];

    currentTree.members.forEach((person) => {
      // 1. Sinh nhật
      if (settings.notifyBirthday && !person.isDeceased && person.birthDate) {
        const dm = parseDayMonth(person.birthDate);
        if (dm) {
          const { daysLeft } = calculateDaysLeftAnnual(dm.day, dm.month);
          if (daysLeft <= daysToScan) {
            upcomingCount++;
            const dayText = daysLeft === 0 ? 'Hôm nay' : daysLeft === 1 ? 'Ngày mai' : `Còn ${daysLeft} ngày`;
            matches.push(`🎂 ${person.fullName} (${dayText})`);
          }
        }
      }

      // 2. Ngày giỗ
      if (settings.notifyAnniversary && person.isDeceased && person.lunarDeathDay) {
        const status = calculateAnniversaryStatus(person.lunarDeathDay);
        if (status.hasValidDate && status.daysLeft >= 0 && status.daysLeft <= daysToScan) {
          upcomingCount++;
          const dayText = status.daysLeft === 0 ? 'Hôm nay' : status.daysLeft === 1 ? 'Ngày mai' : `Còn ${status.daysLeft} ngày`;
          matches.push(`🕯️ Giỗ ${person.fullName} (${dayText})`);
        }
      }
    });

    if (upcomingCount > 0) {
      const summaryText = matches.slice(0, 2).join(' • ');
      const moreText = upcomingCount > 2 ? ` và ${upcomingCount - 2} sự kiện khác...` : '';
      toast.info(`🔔 Nhắc lịch (${daysToScan} ngày tới): ${summaryText}${moreText}`);
    }
  }, [toast]);

  // Initialize Auth
  useEffect(() => {
    const initAuth = async () => {
      // 1. Kiểm tra nếu URL hiện tại là Firebase Magic Link
      if (isFirebaseEmailLink()) {
        setIsLoading(true);
        // Xóa sạch session/token cũ (nếu trình duyệt đang đăng nhập tài khoản khác như Admin)
        removeStoredToken();
        setUser(null);

        const email = getEmailFromUrlOrStorage();
        if (email) {
          try {
            await completeFirebaseSignIn(email);
            const res = await apiMagicLogin(email);
            setStoredToken(res.token);
            setUser(res.user);
            window.history.replaceState(null, '', window.location.pathname);
            toast.success(`Đăng nhập thành công với tài khoản: ${res.user.email}!`);
            await loadTreeData(res.defaultTreeId || undefined, res.user);
            setIsLoading(false);
            return;
          } catch (fbErr: any) {
            console.error('Lỗi hoàn tất Firebase Magic Link:', fbErr);
            toast.error('Liên kết xác thực đã hết hạn hoặc đã được sử dụng. Vui lòng thử lại.');
            window.history.replaceState(null, '', window.location.pathname);
            setIsLoading(false);
            setShowAuthModal(true);
            return;
          }
        } else {
          // Trình duyệt mới (cross-browser / cross-device) chưa có email trong URL hoặc LocalStorage
          setIsLoading(false);
          setShowMagicLinkPrompt(true);
          return;
        }
      }

      // 2. Kiểm tra token đã lưu trong LocalStorage thông thường
      const token = getStoredToken();
      if (!token) {
        setIsLoading(false);
        setShowAuthModal(true);
        return;
      }

      try {
        const currentUser = await apiGetMe();
        setUser(currentUser);
        const savedTreeId = localStorage.getItem('fam3_current_tree_id') || currentUser.trees?.[0]?.id;
        await loadTreeData(savedTreeId, currentUser);
      } catch (err) {
        console.error('Lỗi khởi tạo phiên đăng nhập:', err);
        removeStoredToken();
        setShowAuthModal(true);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Khởi động video motion nền (chống policy chặn autoplay trên mobile/low power mode)
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Trình duyệt có thể yêu cầu cử chỉ chạm đầu tiên của người dùng
      });
    }
  }, []);

  const loadTreeData = async (preferredTreeId?: string, currentUser?: User | null) => {
    try {
      const activeUser = currentUser !== undefined ? currentUser : user;
      let matchedMe: Person | undefined = undefined;

      let targetTreeId = preferredTreeId;

      // Nếu chưa có preferredTreeId, tải danh sách cây để lấy cây đầu tiên
      if (!targetTreeId) {
        let trees: FamilyTree[] = [];
        try {
          trees = await apiGetTrees();
        } catch (treesErr: any) {
          console.warn('apiGetTrees warning:', treesErr);
        }

        if (trees && trees.length > 0) {
          targetTreeId = trees[0].id;
        } else {
          // Nếu người dùng chưa có cây nào, tự động tạo mới
          try {
            const userDisplayName = activeUser?.fullName || activeUser?.email?.split('@')[0] || 'Gia Đình';
            const newTree = await apiCreateTree({
              name: `Gia phả Dòng họ ${userDisplayName}`,
              description: `Cây gia phả số khởi tạo cho ${userDisplayName}`,
              branchName: 'Chi Trưởng',
            });
            targetTreeId = newTree.id;
          } catch (createTreeErr) {
            console.error('Lỗi tự động tạo cây mặc định:', createTreeErr);
          }
        }
      }

      if (targetTreeId) {
        const fullTree = await apiGetTreeById(targetTreeId);

        // Đảm bảo luôn có ít nhất 1 thẻ "Tôi" trong cây của tài khoản mới
        if (fullTree.members.length === 0 && activeUser) {
          try {
            const userDisplayName = activeUser.fullName || activeUser.email.split('@')[0];
            const newMe = await apiCreatePerson({
              treeId: fullTree.id,
              fullName: userDisplayName,
              nickname: 'Tôi',
              gender: 'MALE',
              generation: 1,
              biography: 'Thành viên đầu tiên (Tôi) khởi tạo cây gia phả số.',
            });
            fullTree.members = [newMe];
            matchedMe = newMe;
          } catch (createErr) {
            console.error('Không thể tự động tạo thẻ Tôi:', createErr);
          }
        }

        setTree(fullTree);
        localStorage.setItem('fam3_current_tree_id', fullTree.id);

        // Xác định ô "Tôi" (cá nhân người dùng)
        if (!matchedMe && activeUser && activeUser.fullName) {
          const userLower = activeUser.fullName.toLowerCase().trim();
          matchedMe = fullTree.members.find(
            (m) => m.fullName.toLowerCase().trim() === userLower
          );
        }

        if (!matchedMe) {
          matchedMe = fullTree.members.find((m) => m.nickname === 'Tôi' || m.nickname === 'Tôi (Khởi tạo)');
        }

        // Nếu chỉ có 1 thành viên hoặc chưa khớp, luôn gán thành viên đầu tiên làm "Tôi"
        if (!matchedMe && fullTree.members.length > 0) {
          matchedMe = fullTree.members[0];
        }

        setMePerson(matchedMe || null);

        // Auto show Quick Onboarding Wizard for brand new trees with 1 member ("Tôi")
        if (
          fullTree.members.length === 1 &&
          !localStorage.getItem('fam3_quick_setup_completed')
        ) {
          setShowQuickOnboarding(true);
        } else if (
          fullTree.members.length === 0 &&
          !localStorage.getItem('fam3_onboarding_completed')
        ) {
          setShowTour(true);
        }

        // Check upcoming birthday & anniversary reminders
        checkUpcomingReminders(fullTree, reminderSettings);
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu cây gia phả:', err);
      toast.error('Không thể tải dữ liệu gia phả, vui lòng kiểm tra kết nối.');
    }
  };

  const handleAuthSuccess = async (authUser: User, defaultTreeId?: string) => {
    setUser(authUser);
    setShowAuthModal(false);
    setIsLoading(true);
    await loadTreeData(defaultTreeId, authUser);
    setIsLoading(false);
    toast.success(`Chào mừng ${authUser.fullName} đã đăng nhập!`);
  };

  const handleCreateInitialTree = async () => {
    try {
      setIsLoading(true);
      const userDisplayName = user?.fullName || user?.email?.split('@')[0] || 'Gia Đình';
      const newTree = await apiCreateTree({
        name: `Gia phả Dòng họ ${userDisplayName}`,
        description: `Cây gia phả số khởi tạo cho ${userDisplayName}`,
        branchName: 'Chi Trưởng',
      });
      await loadTreeData(newTree.id, user);
      toast.success('Đã tạo thành công cây gia phả ban đầu!');
    } catch (err: any) {
      console.error('Lỗi tạo cây ban đầu:', err);
      toast.error('Không thể tạo cây gia phả, vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmMagicLinkEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!magicLinkEmail.trim()) return;
    setIsSubmittingMagicLink(true);
    setMagicLinkError(null);
    const cleanEmail = magicLinkEmail.toLowerCase().trim();

    try {
      await completeFirebaseSignIn(cleanEmail);
      const res = await apiMagicLogin(cleanEmail);
      setStoredToken(res.token);
      setUser(res.user);
      setShowMagicLinkPrompt(false);
      window.history.replaceState(null, '', window.location.pathname);
      toast.success(`Đăng nhập thành công với tài khoản: ${res.user.email}!`);
      await loadTreeData(res.defaultTreeId || undefined, res.user);
    } catch (err: any) {
      console.error('Lỗi xác thực email:', err);
      setMagicLinkError('Email xác nhận không khớp với liên kết này hoặc liên kết đã hết hạn.');
    } finally {
      setIsSubmittingMagicLink(false);
    }
  };

  const handleCancelMagicLinkPrompt = () => {
    window.history.replaceState(null, '', window.location.pathname);
    setShowMagicLinkPrompt(false);
    setShowAuthModal(true);
  };

  const handleLogout = () => {
    removeStoredToken();
    setUser(null);
    setTree(null);
    setMePerson(null);
    setShowAuthModal(true);
    toast.info('Đã đăng xuất tài khoản an toàn.');
  };

  const handleExportImageClick = () => {
    setIsExportingImage(true);
    setExportTrigger((prev) => prev + 1);
  };

  const handleOpenAddRelative = (targetPerson: Person) => {
    setAddMemberTarget(targetPerson);
    setShowAddMemberModal(true);
  };

  const handleSelectPerspective = (person: Person) => {
    setMePerson(person);
    setFocusPersonId(person.id);
    toast.info(`Đã đổi vai vế góc nhìn sang: ${person.fullName}`);
  };

  const handleResetToMySelf = () => {
    if (!tree) return;
    let defaultMe: Person | undefined;
    if (user && user.fullName) {
      defaultMe = tree.members.find(
        (m) => m.fullName.toLowerCase().trim() === user.fullName.toLowerCase().trim()
      );
    }
    if (!defaultMe && user?.email?.includes('demo')) {
      defaultMe = tree.members.find((m) => m.fullName.includes('An'));
    }

    if (defaultMe) {
      setMePerson(defaultMe);
      setFocusPersonId(defaultMe.id);
      toast.info(`Đã trở về vị trí của bạn: ${defaultMe.fullName}`);
    } else {
      setMePerson(null);
      toast.info(`Đang ở chế độ xem toàn cảnh dòng họ`);
    }
  };

  if (isLoading) {
    return (
      <div className="app-loading-screen">
        <div className="loading-card">
          <div className="loading-spinner" />
          <h2 className="loading-title">Famlykin - Cây Gia Phả</h2>
          <p className="loading-desc">Đang tải cấu trúc gia phả và phân tầng thế hệ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="familytree-app-root" style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      {/* Dynamic Animated Motion Video Background (Looping Seamlessly, No Watermark) */}
      <div className="app-video-bg-layer" aria-hidden="true">
        <video
          ref={videoRef}
          className="app-video-bg-media"
          autoPlay
          loop
          muted
          playsInline
          poster="/images/bg-green-gradient.png"
        >
          <source src="/videos/bg-green-motion.mp4" type="video/mp4" />
        </video>
        <div className="app-video-bg-overlay" />
      </div>

      {/* 2-Tier Sticky Navbar */}
      <Navbar
        user={user}
        tree={tree}
        mePerson={mePerson}
        mainView={mainView}
        onMainViewChange={setMainView}
        branchFilter={branchFilter}
        onBranchFilterChange={setBranchFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenPersonPicker={() => setShowPersonPicker(true)}
        onOpenAddMember={() => {
          setAddMemberTarget(null);
          setShowAddMemberModal(true);
        }}
        onOpenLunar={() => setShowLunarModal(true)}
        onOpenReminder={() => setShowReminderModal(true)}
        onOpenFlashcard={() => setShowFlashcardModal(true)}
        onExportImage={handleExportImageClick}
        isExportingImage={isExportingImage}
        onLogout={handleLogout}
        onPanToMe={() => mePerson && setFocusPersonId(mePerson.id)}
        onPanToGen1={() => {
          if (tree && tree.members.length > 0) {
            const gen1 = tree.members.find((m) => m.generation === 1);
            if (gen1) setFocusPersonId(gen1.id);
          }
        }}
        onOpenHelp={() => setShowTour(true)}
        onOpenAdmin={() => setShowAdminModal(true)}
      />

      {/* Main Canvas Viewport or Mobile List Directory */}
      <main style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden', width: '100%', display: 'flex', flexDirection: 'column' }}>
        {tree ? (
          mainView === 'TREE' ? (
            <TreeCanvas
              tree={tree}
              mePerson={mePerson}
              branchFilter={branchFilter}
              onBranchFilterChange={setBranchFilter}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onOpenPersonPicker={() => setShowPersonPicker(true)}
              onSelectPerson={(p) => setDrawerPerson(p)}
              exportTrigger={exportTrigger}
              onExportDone={() => {
                setIsExportingImage(false);
                toast.success('Đã tải hình ảnh cây gia phả HD thành công!');
              }}
              focusPersonId={focusPersonId}
              onClearFocusPerson={() => setFocusPersonId(null)}
              onOpenAddMember={() => {
                setAddMemberTarget(null);
                setShowAddMemberModal(true);
              }}
              onStartTutorial={() => setShowTour(true)}
              onOpenAdmin={user?.role === 'ADMIN' ? () => setShowAdminModal(true) : undefined}
            />
          ) : (
            <MemberListView
              tree={tree}
              mePerson={mePerson}
              branchFilter={branchFilter}
              onBranchFilterChange={setBranchFilter}
              onSelectPerson={(p) => setDrawerPerson(p)}
            />
          )
        ) : (
          <div className="canvas-empty-tree">
            <p className="empty-tree-title">Chưa có cây gia phả nào được nạp.</p>
            <button
              type="button"
              className="btn-primary"
              onClick={handleCreateInitialTree}
            >
              + Tạo Cây Gia Phả Đầu Tiên
            </button>
          </div>
        )}
      </main>

      {/* Member Details Drawer */}
      {drawerPerson && (
        <MemberDetailDrawer
          person={drawerPerson}
          tree={tree}
          mePerson={mePerson}
          onClose={() => setDrawerPerson(null)}
          onUpdated={() => {
            if (tree) loadTreeData(tree.id);
            setDrawerPerson(null);
          }}
          onAddRelativeFor={handleOpenAddRelative}
          onSelectPerson={(p) => setDrawerPerson(p)}
        />
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && tree && (
        <AddMemberModal
          tree={tree}
          relativeTarget={addMemberTarget}
          mePerson={mePerson}
          onClose={() => {
            setShowAddMemberModal(false);
            setAddMemberTarget(null);
          }}
          onCreated={() => {
            if (tree) loadTreeData(tree.id);
          }}
        />
      )}

      {/* Lunar Death Anniversary & Cemetery Modal */}
      {showLunarModal && tree && (
        <LunarAnniversaryModal
          tree={tree}
          onClose={() => setShowLunarModal(false)}
          onSelectPerson={(p) => setDrawerPerson(p)}
          onOpenReminderSettings={() => setShowReminderModal(true)}
        />
      )}

      {/* Birthday & Death Anniversary Reminder Settings Modal */}
      <ReminderSettingsModal
        isOpen={showReminderModal}
        onClose={() => setShowReminderModal(false)}
        settings={reminderSettings}
        onUpdateSettings={(newSettings) => {
          setReminderSettings(newSettings);
          if (tree) checkUpcomingReminders(tree, newSettings);
        }}
        tree={tree}
        onSelectPerson={(p) => setDrawerPerson(p)}
      />

      {/* Smart Person Picker Modal */}
      {showPersonPicker && tree && (
        <PersonPickerModal
          isOpen={showPersonPicker}
          tree={tree}
          mePerson={mePerson}
          onSelectPerson={handleSelectPerspective}
          onClose={() => setShowPersonPicker(false)}
          onResetToMe={handleResetToMySelf}
        />
      )}

      {/* Interactive Onboarding Tour / Walkthrough */}
      <OnboardingTour
        isOpen={showTour}
        onClose={() => setShowTour(false)}
        onStartAddMember={() => {
          setShowTour(false);
          setAddMemberTarget(null);
          setShowAddMemberModal(true);
        }}
      />

      {/* Quick Onboarding Wizard (Khởi tạo nhanh nhánh gia đình trực hệ) */}
      <QuickOnboardingModal
        isOpen={showQuickOnboarding}
        user={user}
        mePerson={mePerson}
        tree={tree}
        onClose={() => setShowQuickOnboarding(false)}
        onCompleted={async () => {
          await loadTreeData();
        }}
      />

      {/* User Guide Modal */}
      <HelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />

      {/* Admin Management Dashboard Modal */}
      <AdminModal isOpen={showAdminModal} onClose={() => setShowAdminModal(false)} />

      {/* Family Flashcard Quiz Modal */}
      {showFlashcardModal && tree && (
        <FamilyFlashcardModal
          isOpen={showFlashcardModal}
          tree={tree}
          mePerson={mePerson}
          onClose={() => setShowFlashcardModal(false)}
          onOpenAddMember={() => {
            setAddMemberTarget(null);
            setShowAddMemberModal(true);
          }}
        />
      )}

      {/* Modal Nhập Email Xác Nhận Magic Link (Cross-browser / Cross-device Fallback) */}
      {showMagicLinkPrompt && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(3, 15, 9, 0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '1.5rem',
          }}
        >
          <div
            className="auth-modal-card"
            style={{
              maxWidth: '430px',
              width: '100%',
              padding: '2.2rem 2.4rem',
              background: 'rgba(10, 26, 18, 0.98)',
              borderRadius: '22px',
              border: '1px solid rgba(52, 211, 153, 0.35)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(16, 185, 129, 0.2)',
              color: '#f1f5f9',
              textAlign: 'center',
              animation: 'popUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(6, 78, 59, 0.45) 100%)',
                border: '1px solid rgba(52, 211, 153, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto',
                boxShadow: '0 8px 20px -4px rgba(16, 185, 129, 0.35)',
              }}
            >
              <Mail size={30} color="#34d399" />
            </div>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#ffffff', margin: '0 0 0.5rem 0' }}>
              Xác Nhận Email Đăng Nhập
            </h3>

            <p style={{ fontSize: '0.86rem', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 1.3rem 0' }}>
              Bạn đang mở liên kết xác thực trên một trình duyệt mới. Vui lòng xác nhận địa chỉ email bạn đã dùng để nhận liên kết này:
            </p>

            {magicLinkError && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#fca5a5',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  marginBottom: '1rem',
                  textAlign: 'center',
                }}
              >
                {magicLinkError}
              </div>
            )}

            <form onSubmit={handleConfirmMagicLinkEmail}>
              <div style={{ marginBottom: '1.25rem', position: 'relative' }}>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  autoFocus
                  className="auth-input-dark"
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem 0.8rem 2.6rem',
                    background: '#0a1a12',
                    backgroundColor: '#0a1a12',
                    WebkitBoxShadow: '0 0 0 1000px #0a1a12 inset',
                    boxShadow: '0 0 0 1000px #0a1a12 inset',
                    border: '1px solid rgba(52, 211, 153, 0.35)',
                    borderRadius: '11px',
                    color: '#f1f5f9',
                    fontSize: '0.92rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  value={magicLinkEmail}
                  onChange={(e) => setMagicLinkEmail(e.target.value)}
                />
                <Mail
                  size={17}
                  color="#34d399"
                  style={{
                    position: 'absolute',
                    left: '0.9rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <button
                  type="submit"
                  disabled={isSubmittingMagicLink}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.78rem 1rem',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                    border: '1px solid rgba(52, 211, 153, 0.4)',
                    borderRadius: '11px',
                    cursor: isSubmittingMagicLink ? 'not-allowed' : 'pointer',
                    opacity: isSubmittingMagicLink ? 0.75 : 1,
                    boxShadow: '0 4px 18px rgba(16, 185, 129, 0.35)',
                  }}
                >
                  <Sparkles size={16} />
                  <span>{isSubmittingMagicLink ? 'Đang xác thực...' : 'Hoàn Tất Đăng Nhập'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCancelMagicLinkPrompt}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    padding: '0.4rem',
                    textDecoration: 'underline',
                    textUnderlineOffset: '3px',
                  }}
                >
                  Huỷ bỏ & Quay về Đăng nhập thông thường
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && <AuthModal onSuccess={handleAuthSuccess} />}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
};

export default App;
