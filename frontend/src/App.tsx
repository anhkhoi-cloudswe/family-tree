import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mail, Sparkles } from 'lucide-react';
import { Layout } from './components/Layout';
import { Navbar } from './components/Navbar';
import { TreeCanvas } from './components/TreeCanvas';
import { MemberListView } from './components/MemberListView';
import { LunarAnniversaryView } from './components/LunarAnniversaryView';
import { MemberDetailDrawer } from './components/MemberDetailDrawer';
import { AddMemberModal } from './components/AddMemberModal';
import { LunarAnniversaryModal } from './components/LunarAnniversaryModal';
import { ReminderSettingsModal } from './components/ReminderSettingsModal';
import { AuthModal } from './components/AuthModal';
import { PersonPickerModal } from './components/PersonPickerModal';
import { HelpModal } from './components/HelpModal';
import { AdminModal } from './components/AdminModal';
import { AdminDashboard, AdminTab } from './components/AdminDashboard';
import { OnboardingTour } from './components/OnboardingTour';
import { QuickOnboardingModal } from './components/QuickOnboardingModal';
import { FamilyFlashcardModal } from './components/FamilyFlashcardModal';
import { ShareTreeModal } from './components/ShareTreeModal';
import { InvitationNotificationModal } from './components/InvitationNotificationModal';
import { InviteLinkJoinModal, InviteLinkInfo } from './components/InviteLinkJoinModal';
import { UpdatePhoneModal } from './components/UpdatePhoneModal';
import { UserProfileModal } from './components/UserProfileModal';
import { AccountRestoreOverlay } from './components/AccountRestoreOverlay';
import { BranchesHubView } from './components/BranchesHubView';
import { SubscriptionModal } from './components/SubscriptionModal';
import { RenameTreeModal } from './components/RenameTreeModal';
import { CreateTreeModal } from './components/CreateTreeModal';
import { FamilyTreeLogo } from './components/FamilyTreeLogo';
import { ToastProvider, useToast } from './components/Toast';
import { User, FamilyTree, Person, TreeRole, TreeInvitation, SubscriptionStatus } from './types';
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
  apiDeleteTree,
  apiGetSubscriptionStatus,
  apiCreatePerson,
  apiMagicLogin,
  apiVerifyRegistration,
  apiCompleteRegistration,
  apiGetPendingInvitations,
  apiAcceptInvitation,
  apiDeclineInvitation,
  apiGetInviteLinkInfo,
  apiLeaveTree,
  downloadTreeExcel,
  getStoredToken,
  setStoredToken,
  removeStoredToken,
} from './services/api';
import {
  isFirebaseEmailLink,
  getEmailFromUrlOrStorage,
  completeFirebaseSignIn,
  applyEmailVerificationCode,
} from './services/firebase';
import { getSupabaseClient } from './services/supabase';
import { wsClient } from './services/websocket';

const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [tree, setTree] = useState<FamilyTree | null>(null);
  const [allTrees, setAllTrees] = useState<FamilyTree[]>([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [mePerson, setMePerson] = useState<Person | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [resetPasswordToken, setResetPasswordToken] = useState<string | null>(null);

  // Magic Link Confirmation states for cross-device/cross-browser
  const [showMagicLinkPrompt, setShowMagicLinkPrompt] = useState<boolean>(false);
  const [magicLinkEmail, setMagicLinkEmail] = useState<string>('');
  const [isSubmittingMagicLink, setIsSubmittingMagicLink] = useState<boolean>(false);
  const [magicLinkError, setMagicLinkError] = useState<string | null>(null);

  // Main View: Tất cả Nhánh (BRANCHES) | Sơ đồ Cây (TREE) | Danh Bạ Thu Gọn (LIST) | Lịch Giỗ (LUNAR)
  const [mainView, setMainView] = useState<'BRANCHES' | 'TREE' | 'LIST' | 'LUNAR'>('TREE');

  // Modals & Drawer states
  const [drawerPerson, setDrawerPerson] = useState<Person | null>(null);
  const [drawerHistory, setDrawerHistory] = useState<Person[]>([]);
  const [drawerSource, setDrawerSource] = useState<'LUNAR' | 'REMINDER' | null>(null);
  const [addMemberTarget, setAddMemberTarget] = useState<Person | null>(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState<boolean>(false);
  const [showLunarModal, setShowLunarModal] = useState<boolean>(false);
  const [showReminderModal, setShowReminderModal] = useState<boolean>(false);
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(getStoredReminderSettings);
  const [showPersonPicker, setShowPersonPicker] = useState<boolean>(false);
  const [personPickerMode, setPersonPickerMode] = useState<'SEARCH' | 'PERSPECTIVE'>('SEARCH');
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [showTour, setShowTour] = useState<boolean>(false);
  const [showQuickOnboarding, setShowQuickOnboarding] = useState<boolean>(false);
  const [showFlashcardModal, setShowFlashcardModal] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [sharingTree, setSharingTree] = useState<FamilyTree | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState<boolean>(false);
  const [showRenameTreeModal, setShowRenameTreeModal] = useState<boolean>(false);
  const [renamingTree, setRenamingTree] = useState<FamilyTree | null>(null);
  const [showCreateTreeModal, setShowCreateTreeModal] = useState<boolean>(false);
  const [showInvitationsModal, setShowInvitationsModal] = useState<boolean>(false);
  const [showInviteLinkModal, setShowInviteLinkModal] = useState<boolean>(false);
  const [inviteLinkInfo, setInviteLinkInfo] = useState<InviteLinkInfo | null>(null);
  const [showUpdatePhoneModal, setShowUpdatePhoneModal] = useState<boolean>(false);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [pendingInvitations, setPendingInvitations] = useState<TreeInvitation[]>([]);

  // Dedicated Admin Dashboard states
  const [adminActiveTab, setAdminActiveTab] = useState<AdminTab>('USERS');

  // Filters & View Mode
  const [branchFilter, setBranchFilter] = useState<'ALL' | 'PATERNAL' | 'MATERNAL'>('ALL');
  const [viewMode, setViewMode] = useState<'COMPACT' | 'DETAILED'>('DETAILED');
  const [focusPersonId, setFocusPersonId] = useState<string | null>(null);

  // Image & Excel Export state
  const [exportTrigger, setExportTrigger] = useState<number>(0);
  const [isExportingImage, setIsExportingImage] = useState<boolean>(false);
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);

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

  // Load pending invitations for current user
  const loadPendingInvitations = useCallback(async () => {
    if (!getStoredToken()) return;
    try {
      const list = await apiGetPendingInvitations();
      setPendingInvitations(list || []);
      // Tự động nhắc người dùng nếu có lời mời gia phả đang chờ phản hồi
      if (list && list.length > 0 && !sessionStorage.getItem('famlykin_invites_prompted')) {
        setShowInvitationsModal(true);
        sessionStorage.setItem('famlykin_invites_prompted', 'true');
      }
    } catch (err) {
      console.warn('Lỗi kiểm tra lời mời gia phả:', err);
    }
  }, []);

  // Tải danh sách các nhánh và thông tin gói hội viên
  const refreshTreesAndSubscription = useCallback(async () => {
    if (!getStoredToken()) return;
    try {
      const [treesRes, subRes] = await Promise.allSettled([
        apiGetTrees(),
        apiGetSubscriptionStatus(),
      ]);
      if (treesRes.status === 'fulfilled') {
        setAllTrees(treesRes.value || []);
      }
      if (subRes.status === 'fulfilled') {
        setSubscriptionStatus(subRes.value);
      }
    } catch (err) {
      console.warn('Lỗi tải danh sách cây và trạng thái gói:', err);
    }
  }, []);

  // Kiểm tra liên kết mời trực tiếp (?inviteTree=...)
  const checkDirectInviteLink = useCallback(async () => {
    const pendingTreeId =
      sessionStorage.getItem('famlykin_pending_invite_tree') ||
      new URLSearchParams(window.location.search).get('inviteTree');
    if (!pendingTreeId) return;

    try {
      const info = await apiGetInviteLinkInfo(pendingTreeId);
      if (info && info.treeId) {
        setInviteLinkInfo(info);
        setShowInviteLinkModal(true);
      }
    } catch (err: any) {
      console.warn('Không thể nạp thông tin liên kết mời:', err);
      sessionStorage.removeItem('famlykin_pending_invite_tree');
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadPendingInvitations();
      refreshTreesAndSubscription();
      checkDirectInviteLink();
    }
  }, [user, loadPendingInvitations, refreshTreesAndSubscription, checkDirectInviteLink]);

  // 1. WebSocket: Tự động đồng bộ cây gia phả theo thời gian thực mà không cần tải lại trang
  useEffect(() => {
    if (!tree?.id) return;
    const unsubscribe = wsClient.subscribeToTree(tree.id, () => {
      loadTreeData(tree.id, user);
      refreshTreesAndSubscription();
    });
    return () => unsubscribe();
  }, [tree?.id, user, refreshTreesAndSubscription]);

  // 2. WebSocket: Tự động cập nhật thông báo cá nhân (lời mời mới, quyền hạn cộng tác, thay đổi gói, thêm/xóa nhánh)
  useEffect(() => {
    if (!user?.id) return;
    const unsubscribe = wsClient.subscribeToUser(user.id, (data) => {
      loadPendingInvitations();
      refreshTreesAndSubscription();
      if (
        data?.action === 'ROLE_UPDATED' ||
        data?.action === 'COLLABORATOR_REMOVED' ||
        data?.action === 'SUBSCRIPTION_UPDATED' ||
        data?.action === 'TREE_CREATED' ||
        data?.action === 'TREE_UPDATED' ||
        data?.action === 'TREE_DELETED'
      ) {
        if (tree?.id) {
          loadTreeData(tree.id, user);
        }
      }
    });
    return () => unsubscribe();
  }, [user?.id, tree?.id, loadPendingInvitations, refreshTreesAndSubscription]);

  // Initialize Auth
  useEffect(() => {
    const initAuth = async () => {
      // 0. Lưu link mời (inviteTree) và kiểm tra trạng thái thanh toán PayOS từ URL
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const inviteTreeParam = searchParams.get('inviteTree') || hashParams.get('inviteTree');
      if (inviteTreeParam) {
        sessionStorage.setItem('famlykin_pending_invite_tree', inviteTreeParam);
      }

      const paymentParam = searchParams.get('payment');
      if (paymentParam === 'success') {
        toast.success('Thanh toán PayOS thành công! Gói PRO của bạn đã được kích hoạt.');
        window.history.replaceState(null, '', window.location.pathname);
      } else if (paymentParam === 'cancel') {
        toast.info('Giao dịch thanh toán PayOS đã bị hủy.');
        window.history.replaceState(null, '', window.location.pathname);
      }

      // Kiểm tra nếu URL hiện tại chứa verify_token hoặc reset_token từ Cloudflare email
      const verifyToken = searchParams.get('verify_token') || hashParams.get('verify_token');
      const resetToken = searchParams.get('reset_token') || hashParams.get('reset_token');

      if (verifyToken) {
        setIsLoading(true);
        removeStoredToken();
        setUser(null);
        try {
          const res = await apiVerifyRegistration(verifyToken);
          setStoredToken(res.token);
          setUser(res.user);
          window.history.replaceState(null, '', window.location.pathname);
          toast.success(res.message || `Xác thực thành công! Chào mừng ${res.user.fullName || res.user.email}`);
          await loadTreeData(res.defaultTreeId || undefined, res.user);
          setIsLoading(false);
          return;
        } catch (err: any) {
          console.error('Lỗi xác thực tạo tài khoản:', err);
          window.history.replaceState(null, '', window.location.pathname);
          toast.error(err.message || 'Liên kết xác thực không hợp lệ hoặc đã hết hạn.');
          setIsLoading(false);
          setShowAuthModal(true);
          return;
        }
      }

      if (resetToken) {
        window.history.replaceState(null, '', window.location.pathname);
        setResetPasswordToken(resetToken);
        setShowAuthModal(true);
        setIsLoading(false);
        return;
      }

      // 1. Kiểm tra nếu URL hiện tại là Firebase Email Verification (mode=verifyEmail)
      const urlParams = new URLSearchParams(window.location.search);
      const authMode = urlParams.get('mode');
      const oobCode = urlParams.get('oobCode');

      if (authMode === 'verifyEmail' && oobCode) {
        setIsLoading(true);
        try {
          await applyEmailVerificationCode(oobCode);
          toast.success('Xác thực email thành công! Đang hoàn tất đăng nhập...');

          // Kiểm tra xem có pending signup lưu ở LocalStorage không
          const pendingRaw = localStorage.getItem('famlykin_pending_signup');
          let pendingSignup = null;
          if (pendingRaw) {
            try { pendingSignup = JSON.parse(pendingRaw); } catch {}
          }

          if (pendingSignup && pendingSignup.email) {
            const res = await apiCompleteRegistration({
              email: pendingSignup.email,
              fullName: pendingSignup.fullName,
              password: pendingSignup.password,
            });
            localStorage.removeItem('famlykin_pending_signup');
            setStoredToken(res.token);
            setUser(res.user);
            window.history.replaceState(null, '', window.location.pathname);
            await loadTreeData(res.defaultTreeId || undefined, res.user);
            setIsLoading(false);
            return;
          } else {
            // Mở link trên thiết bị khác -> chuyển hướng về Đăng nhập để người dùng nhập mật khẩu
            window.history.replaceState(null, '', window.location.pathname);
            toast.success('Email đã được kích hoạt thành công! Vui lòng đăng nhập với mật khẩu của bạn.');
            setIsLoading(false);
            setShowAuthModal(true);
            return;
          }
        } catch (fbErr: any) {
          console.error('Lỗi kích hoạt email Firebase:', fbErr);
          window.history.replaceState(null, '', window.location.pathname);
          toast.error('Liên kết xác thực không hợp lệ hoặc đã được sử dụng.');
          setIsLoading(false);
          setShowAuthModal(true);
          return;
        }
      }

      // 2. Kiểm tra nếu URL hiện tại là Firebase Magic Link
      if (isFirebaseEmailLink()) {

        // Kiểm tra xem oobCode đã được xử lý trong phiên tab này chưa
        if (oobCode) {
          const sessionKey = `famlykin_consumed_${oobCode}`;
          if (sessionStorage.getItem(sessionKey)) {
            console.warn('[Auth] oobCode already processed in this tab session:', oobCode);
            return;
          }
        }

        setIsLoading(true);
        const email = getEmailFromUrlOrStorage();
        if (email) {
          if (oobCode) {
            sessionStorage.setItem(`famlykin_consumed_${oobCode}`, 'true');
          }
          try {
            await completeFirebaseSignIn(email);

            // Kiểm tra xem đây có phải là tài khoản mới đang chờ đăng ký không
            const pendingRaw = localStorage.getItem('famlykin_pending_signup');
            let pendingSignup = null;
            if (pendingRaw) {
              try { pendingSignup = JSON.parse(pendingRaw); } catch {}
            }

            let res;
            if (
              pendingSignup &&
              pendingSignup.email &&
              pendingSignup.email.toLowerCase().trim() === email.toLowerCase().trim()
            ) {
              res = await apiCompleteRegistration({
                email: pendingSignup.email,
                fullName: pendingSignup.fullName,
                password: pendingSignup.password,
              });
              localStorage.removeItem('famlykin_pending_signup');
            } else {
              res = await apiMagicLogin(email);
            }

            setStoredToken(res.token);
            setUser(res.user);
            window.history.replaceState(null, '', window.location.pathname);
            toast.success(`Xác thực thành công! Chào mừng ${res.user.fullName || res.user.email}`);
            await loadTreeData(res.defaultTreeId || undefined, res.user);
            setIsLoading(false);
            return;
          } catch (fbErr: any) {
            console.error('Lỗi hoàn tất Firebase Magic Link:', fbErr);
            const code = fbErr?.code || '';
            let msg = 'Liên kết xác thực đã hết hạn hoặc không hợp lệ. Vui lòng thử lại.';
            if (code === 'auth/invalid-action-code') {
              msg = 'Liên kết xác thực này đã được sử dụng hoặc đã hết hạn. Vui lòng bấm gửi lại email mới.';
            } else if (code === 'auth/invalid-email') {
              msg = 'Email không khớp với liên kết xác thực.';
            }
            toast.error(msg);
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
        const urlParams = new URLSearchParams(window.location.search);
        const inviteParamTreeId = urlParams.get('inviteTree') || urlParams.get('treeId');
        const savedTreeId = inviteParamTreeId || localStorage.getItem('fam3_current_tree_id') || currentUser.trees?.[0]?.id;
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

  // Khởi động video motion nền bằng callback ref để bảo đảm autoplay hoạt động ngay lập tức
  const videoCallbackRef = useCallback((v: HTMLVideoElement | null) => {
    if (!v) return;
    v.defaultMuted = true;
    v.muted = true;
    v.playsInline = true;

    const tryPlay = () => {
      const p = v.play();
      if (p !== undefined) {
        p.catch(() => {});
      }
    };

    tryPlay();

    const onUserAction = () => {
      tryPlay();
      window.removeEventListener('click', onUserAction);
      window.removeEventListener('touchstart', onUserAction);
      window.removeEventListener('pointerdown', onUserAction);
      window.removeEventListener('keydown', onUserAction);
      window.removeEventListener('mousemove', onUserAction);
    };

    window.addEventListener('click', onUserAction, { passive: true });
    window.addEventListener('touchstart', onUserAction, { passive: true });
    window.addEventListener('pointerdown', onUserAction, { passive: true });
    window.addEventListener('keydown', onUserAction, { passive: true });
    window.addEventListener('mousemove', onUserAction, { passive: true });
  }, []);

  const loadTreeData = async (preferredTreeId?: string, currentUser?: User | null) => {
    try {
      const activeUser = currentUser !== undefined ? currentUser : user;
      let targetTreeId = preferredTreeId;
      let fullTree: FamilyTree | null = null;

      // 1. Nếu có targetTreeId, thử tải cây đó trước
      if (targetTreeId) {
        try {
          fullTree = await apiGetTreeById(targetTreeId);
        } catch (fetchErr: any) {
          console.warn(`Cây ${targetTreeId} không tồn tại hoặc đã bị khóa/xóa:`, fetchErr);
          if (fetchErr?.message?.includes('khóa') || fetchErr?.isLocked) {
            toast.error('Nhánh cây này đang bị khóa do vượt giới hạn gói Miễn Phí. Vui lòng nâng cấp PRO để mở khóa!');
            setShowSubscriptionModal(true);
            setMainView('BRANCHES');
          }
          localStorage.removeItem('fam3_current_tree_id');
          targetTreeId = undefined;
          fullTree = null;
        }
      }

      // 2. Nếu chưa có cây hợp lệ, lấy danh sách tất cả các cây của người dùng
      if (!fullTree) {
        let trees: FamilyTree[] = [];
        try {
          trees = await apiGetTrees();
          setAllTrees(trees || []);
        } catch (treesErr: any) {
          console.warn('Lỗi lấy danh sách cây gia phả:', treesErr);
        }

        const firstUnlocked = trees.find((t) => !t.isLocked);
        if (firstUnlocked) {
          try {
            fullTree = await apiGetTreeById(firstUnlocked.id);
          } catch (firstTreeErr) {
            console.error('Không thể tải cây đầu tiên trong danh sách:', firstTreeErr);
          }
        }
      }

      if (fullTree) {
        setTree(fullTree);
        localStorage.setItem('fam3_current_tree_id', fullTree.id);

        // Xác định ô "Tôi" (cá nhân người dùng độc lập)
        let matchedMe: Person | undefined = undefined;

        // 1. Ưu tiên: nếu là người cộng tác được chia sẻ và có linkedPersonId
        if (fullTree.linkedPersonId) {
          matchedMe = fullTree.members.find((m) => m.id === fullTree.linkedPersonId);
        }

        // 2. Nếu người dùng có số điện thoại, so khớp với SĐT thành viên trong cây
        if (!matchedMe && activeUser?.phone) {
          const cleanPhone = activeUser.phone.trim();
          matchedMe = fullTree.members.find((m) => m.phone && m.phone.trim() === cleanPhone);
        }

        // 3. So khớp theo Họ tên người dùng
        if (!matchedMe && activeUser && activeUser.fullName) {
          const userLower = activeUser.fullName.toLowerCase().trim();
          matchedMe = fullTree.members.find(
            (m) => m.fullName.toLowerCase().trim() === userLower
          );
        }

        const isOwner = !fullTree.userRole || fullTree.userRole === 'OWNER';

        // CHỈ gán fallback ô 'Tôi' nếu người dùng là Chủ nhánh (Owner) của cây này.
        // Đối với người được mời (Viewer / Editor), nếu họ chưa được liên kết hay khớp với thành viên nào trong cây,
        // thì mePerson = null (tuyệt đối KHÔNG gán nhãn "Tôi" của chủ nhánh cho người xem bên ngoài).
        if (!matchedMe && isOwner) {
          matchedMe = fullTree.members.find((m) => m.nickname === 'Tôi' || m.nickname === 'Tôi (Khởi tạo)');
          if (!matchedMe && fullTree.members.length > 0) {
            matchedMe = fullTree.members[0];
          }
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
      } else {
        setTree(null);
        setMePerson(null);
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
      await refreshTreesAndSubscription();
      toast.success('Đã tạo thành công cây gia phả ban đầu!');
    } catch (err: any) {
      console.error('Lỗi tạo cây ban đầu:', err);
      toast.error('Không thể tạo cây gia phả, vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTree = async (treeId: string) => {
    const target = allTrees.find((t) => t.id === treeId);
    if (target?.isLocked) {
      toast.error('Nhánh cây này đang bị khóa do vượt quá 5 nhánh của gói Miễn Phí. Vui lòng nâng cấp PRO để mở khóa!');
      setShowSubscriptionModal(true);
      return;
    }
    setIsLoading(true);
    await loadTreeData(treeId);
    setMainView('TREE');
    setIsLoading(false);
  };

  const handleDeleteTree = async (treeId: string, treeName: string) => {
    try {
      setIsLoading(true);
      await apiDeleteTree(treeId);
      toast.success(`Đã xóa thành công nhánh "${treeName}"!`);
      await refreshTreesAndSubscription();
      if (tree?.id === treeId) {
        setTree(null);
        setMePerson(null);
        localStorage.removeItem('fam3_current_tree_id');
        setMainView('BRANCHES');
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi xóa nhánh cây gia phả');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveTree = async (treeId: string, treeName: string) => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      await apiLeaveTree(treeId, user.id);
      toast.success(`Bạn đã rời khỏi nhánh "${treeName}" thành công.`);
      await refreshTreesAndSubscription();
      if (tree?.id === treeId) {
        setTree(null);
        setMePerson(null);
        localStorage.removeItem('fam3_current_tree_id');
        setMainView('BRANCHES');
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi rời khỏi nhánh cây');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenameSuccess = (updated: FamilyTree) => {
    setAllTrees((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)));
    if (tree?.id === updated.id) {
      setTree((prev) => (prev ? { ...prev, ...updated } : prev));
    }
  };

  const handleTreeCreated = async (newTree: FamilyTree) => {
    await refreshTreesAndSubscription();
    await loadTreeData(newTree.id);
    setMainView('TREE');
  };

  const handleConfirmMagicLinkEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!magicLinkEmail.trim()) return;
    setIsSubmittingMagicLink(true);
    setMagicLinkError(null);
    const cleanEmail = magicLinkEmail.toLowerCase().trim();
    const urlParams = new URLSearchParams(window.location.search);
    const oobCode = urlParams.get('oobCode');
    if (oobCode) {
      sessionStorage.setItem(`famlykin_consumed_${oobCode}`, 'true');
    }

    try {
      await completeFirebaseSignIn(cleanEmail);

      // Kiểm tra xem đây có phải là tài khoản mới đang chờ đăng ký không
      const pendingRaw = localStorage.getItem('famlykin_pending_signup');
      let pendingSignup = null;
      if (pendingRaw) {
        try { pendingSignup = JSON.parse(pendingRaw); } catch {}
      }

      let res;
      if (pendingSignup && pendingSignup.email?.toLowerCase().trim() === cleanEmail) {
        res = await apiCompleteRegistration({
          email: pendingSignup.email,
          fullName: pendingSignup.fullName,
          password: pendingSignup.password,
        });
        localStorage.removeItem('famlykin_pending_signup');
      } else {
        res = await apiCompleteRegistration({
          email: cleanEmail,
        });
      }

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
    setAdminActiveTab('USERS');
    setShowAuthModal(true);
    toast.info('Đã đăng xuất tài khoản an toàn.');
  };

  const handleExportImageClick = () => {
    setIsExportingImage(true);
    setExportTrigger((prev) => prev + 1);
  };

  const handleExportExcel = async () => {
    if (!tree) return;
    if (subscriptionStatus?.tier !== 'PRO' && user?.role !== 'ADMIN') {
      toast.info(
        'Tính năng Xuất báo cáo & file Excel danh bạ gia đình dành riêng cho Gói PRO. Nâng cấp ngay để mở khóa!'
      );
      setShowSubscriptionModal(true);
      return;
    }
    try {
      setIsExportingExcel(true);
      await downloadTreeExcel(tree.id, tree.name);
      toast.success('Đã xuất file Excel danh bạ dòng họ thành công!');
    } catch (err: any) {
      if (err.requiresPro) {
        setShowSubscriptionModal(true);
      }
      toast.error(err.message || 'Không thể xuất file Excel, vui lòng thử lại');
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleOpenAddRelative = (targetPerson: Person) => {
    setAddMemberTarget(targetPerson);
    setShowAddMemberModal(true);
  };

  const handleDrawerBack = () => {
    if (drawerHistory.length > 0) {
      const prevPerson = drawerHistory[drawerHistory.length - 1];
      setDrawerHistory((prev) => prev.slice(0, prev.length - 1));
      setDrawerPerson(prevPerson);
      return;
    }
    const src = drawerSource;
    setDrawerPerson(null);
    setDrawerSource(null);
    setDrawerHistory([]);
    if (src === 'LUNAR') {
      setShowLunarModal(true);
    } else if (src === 'REMINDER') {
      setShowReminderModal(true);
    }
  };

  const handleCloseDrawer = () => {
    setDrawerPerson(null);
    setDrawerSource(null);
    setDrawerHistory([]);
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
        <div className="app-loading-bg-layer" aria-hidden="true">
          <video
            ref={videoCallbackRef}
            className="app-video-bg-media"
            src="/videos/bg-green-motion.mp4?v=20261024_02"
            autoPlay
            loop
            muted
            playsInline
            poster="/images/bg-green-gradient.png"
          >
            <source src="/videos/bg-green-motion.mp4?v=20261024_02" type="video/mp4" />
          </video>
          <div className="app-video-bg-overlay" />
        </div>
        <div className="loading-card">
          <div className="loading-logo-box">
            <div className="loading-ring-spinner" />
            <FamilyTreeLogo
              size={56}
              style={{
                filter: 'drop-shadow(0 8px 20px rgba(0, 0, 0, 0.5))',
              }}
            />
          </div>
          <h2 className="loading-title">Famlykin</h2>
          <p className="loading-desc">Đang tải gia phả...</p>
          <div className="loading-progress-bar">
            <div className="loading-progress-indeterminate" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="familytree-app-root" style={{ height: '100dvh', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      {/* Dynamic Animated Motion Video Background (Looping Seamlessly, No Watermark) */}
      <div className="app-video-bg-layer" aria-hidden="true">
        <video
          ref={videoCallbackRef}
          className="app-video-bg-media"
          src="/videos/bg-green-motion.mp4?v=20261024_02"
          autoPlay
          loop
          muted
          playsInline
          poster="/images/bg-green-gradient.png"
        >
          <source src="/videos/bg-green-motion.mp4?v=20261024_02" type="video/mp4" />
        </video>
        <div className="app-video-bg-overlay" />
      </div>

      {/* 3-Mode Sidebar Layout */}
      <Layout
        user={user}
        tree={tree}
        activeNav={
          user?.role === 'ADMIN'
            ? mainView === 'BRANCHES'
              ? 'BRANCHES'
              : `ADMIN_${adminActiveTab}`
            : mainView
        }
        onSelectNav={(key) => {
          if (key === 'BRANCHES') setMainView('BRANCHES');
          else if (key === 'TREE') setMainView('TREE');
          else if (key === 'LIST') setMainView('LIST');
          else if (key === 'LUNAR') setMainView('LUNAR');
          else if (key === 'FLASHCARD') setShowFlashcardModal(true);
          else if (key === 'REMINDER') setShowReminderModal(true);
          else if (key === 'SHARE') {
            setSharingTree(tree);
            setShowShareModal(true);
          }
          else if (key === 'SUBSCRIPTION') {
            setShowSubscriptionModal(true);
          }
          else if (key === 'ADMIN_USERS') {
            setMainView('TREE');
            setAdminActiveTab('USERS');
          }
          else if (key === 'ADMIN_SUBSCRIPTIONS') {
            setMainView('TREE');
            setAdminActiveTab('SUBSCRIPTIONS');
          }
          else if (key === 'ADMIN_REPORTS') {
            setMainView('TREE');
            setAdminActiveTab('REPORTS');
          }
          else if (key === 'ADMIN') setShowAdminModal(true);
        }}
        onAdminTabSelect={(tab) => {
          setMainView('TREE');
          setAdminActiveTab(tab);
        }}
        pendingInvitationsCount={pendingInvitations.length}
        onOpenInvitations={() => setShowInvitationsModal(true)}
        onOpenShareModal={() => {
          setSharingTree(tree);
          setShowShareModal(true);
        }}
        onOpenBranchesHub={() => setMainView('BRANCHES')}
        allTreesCount={allTrees.length}
        onOpenSubscription={() => setShowSubscriptionModal(true)}
        isPro={subscriptionStatus?.tier === 'PRO'}
        onUpdatePhone={() => setShowUpdatePhoneModal(true)}
        onOpenProfile={() => setShowProfileModal(true)}
        onLogout={handleLogout}
        onOpenPersonPicker={() => {
          setPersonPickerMode('SEARCH');
          setShowPersonPicker(true);
        }}
      >
        {/* 2-Tier Sticky Navbar: Show when viewing Tree or Member List */}
        {mainView !== 'BRANCHES' && (
          <Navbar
            user={user}
            tree={tree}
            isPro={subscriptionStatus?.tier === 'PRO'}
            onOpenSubscription={() => setShowSubscriptionModal(true)}
            mePerson={mePerson}
            userRole={tree?.userRole || 'OWNER'}
            pendingInvitationsCount={pendingInvitations.length}
            onOpenInvitations={() => setShowInvitationsModal(true)}
            onOpenShareModal={() => {
              setSharingTree(tree);
              setShowShareModal(true);
            }}
            onBackToBranches={() => setMainView('BRANCHES')}
            mainView={mainView as 'TREE' | 'LIST'}
            onMainViewChange={(mode) => setMainView(mode)}
            branchFilter={branchFilter}
            onBranchFilterChange={setBranchFilter}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onOpenPersonPicker={() => {
              setPersonPickerMode('PERSPECTIVE');
              setShowPersonPicker(true);
            }}
            onOpenAddMember={() => {
              setAddMemberTarget(null);
              setShowAddMemberModal(true);
            }}
            onOpenLunar={() => setMainView('LUNAR')}
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
            adminActiveTab={adminActiveTab}
            onAdminTabChange={setAdminActiveTab}
          />
        )}

        {/* Main Canvas Viewport, Branches Hub, or Embedded Admin Dashboard */}
        <main style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden', width: '100%', display: 'flex', flexDirection: 'column' }}>
        {user?.role === 'ADMIN' && mainView !== 'BRANCHES' ? (
          <AdminDashboard
            activeTab={adminActiveTab}
            onTabChange={setAdminActiveTab}
            onLogout={handleLogout}
          />
        ) : mainView === 'BRANCHES' ? (
          <BranchesHubView
            trees={allTrees}
            pendingInvitations={pendingInvitations}
            currentTreeId={tree?.id || null}
            currentUser={user}
            subscriptionStatus={subscriptionStatus}
            onSelectTree={handleSelectTree}
            onOpenCreateTree={() => setShowCreateTreeModal(true)}
            onOpenRenameTree={(t) => {
              setRenamingTree(t);
              setShowRenameTreeModal(true);
            }}
            onOpenShareTree={(t) => {
              setSharingTree(t);
              setShowShareModal(true);
            }}
            onDeleteTree={handleDeleteTree}
            onLeaveTree={handleLeaveTree}
            onAcceptInvitation={async (inv) => {
              try {
                const res = await apiAcceptInvitation(inv.id);
                toast.success(res.message || `Đã tham gia cây gia phả "${inv.tree.name}"!`);
                await refreshTreesAndSubscription();
                await loadPendingInvitations();
                await loadTreeData(inv.treeId);
                setMainView('TREE');
              } catch (err: any) {
                toast.error(err.message || 'Không thể chấp nhận lời mời');
              }
            }}
            onDeclineInvitation={async (inv) => {
              if (!window.confirm(`Bạn có chắc chắn muốn xóa lời mời vào cây gia phả "${inv.tree.name}"?`)) {
                return;
              }
              try {
                const res = await apiDeclineInvitation(inv.id);
                toast.info(res.message || 'Đã xóa lời mời');
                await loadPendingInvitations();
              } catch (err: any) {
                toast.error(err.message || 'Lỗi khi xóa lời mời');
              }
            }}
            onOpenSubscriptionModal={() => setShowSubscriptionModal(true)}
          />
        ) : tree ? (
          mainView === 'TREE' ? (
            <TreeCanvas
              tree={tree}
              mePerson={mePerson}
              branchFilter={branchFilter}
              onBranchFilterChange={setBranchFilter}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onOpenPersonPicker={() => {
                setPersonPickerMode('PERSPECTIVE');
                setShowPersonPicker(true);
              }}
              onSelectPerson={(p) => {
                setDrawerSource(null);
                setDrawerHistory([]);
                setDrawerPerson(p);
              }}
              exportTrigger={exportTrigger}
              onExportDone={() => {
                setIsExportingImage(false);
                toast.success(
                  subscriptionStatus?.tier === 'PRO'
                    ? 'Đã xuất và tải hình ảnh cây gia phả Ultra-HD 4K siêu nét thành công!'
                    : 'Đã tải hình ảnh cây gia phả HD tiêu chuẩn thành công!'
                );
              }}
              isPro={subscriptionStatus?.tier === 'PRO'}
              focusPersonId={focusPersonId}
              onClearFocusPerson={() => setFocusPersonId(null)}
              onOpenAddMember={() => {
                setAddMemberTarget(null);
                setShowAddMemberModal(true);
              }}
              onStartTutorial={() => setShowTour(true)}
              onOpenAdmin={user?.role === 'ADMIN' ? () => setShowAdminModal(true) : undefined}
              onExportExcel={handleExportExcel}
              isExportingExcel={isExportingExcel}
            />
          ) : mainView === 'LIST' ? (
            <MemberListView
              tree={tree}
              mePerson={mePerson}
              branchFilter={branchFilter}
              onBranchFilterChange={setBranchFilter}
              onSelectPerson={(p) => {
                setDrawerSource(null);
                setDrawerHistory([]);
                setDrawerPerson(p);
              }}
            />
          ) : (
            <LunarAnniversaryView
              tree={tree}
              onSelectPerson={(p) => {
                setDrawerSource(null);
                setDrawerHistory([]);
                setDrawerPerson(p);
              }}
              onOpenReminderSettings={() => setShowReminderModal(true)}
            />
          )
        ) : (
          <div className="canvas-empty-tree">
            <p className="empty-tree-title">Chưa có cây gia phả nào được nạp.</p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setMainView('BRANCHES')}
              >
                Xem Danh Sách Nhánh ({allTrees.length})
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowCreateTreeModal(true)}
              >
                + Tạo Nhánh Mới
              </button>
            </div>
          </div>
        )}
      </main>
      </Layout>

      {/* Member Details Drawer */}
      {drawerPerson && (
        <MemberDetailDrawer
          person={drawerPerson}
          tree={tree}
          mePerson={mePerson}
          onClose={handleCloseDrawer}
          onBack={drawerSource || drawerHistory.length > 0 ? handleDrawerBack : undefined}
          onUpdated={() => {
            if (tree) loadTreeData(tree.id);
            handleCloseDrawer();
          }}
          onAddRelativeFor={handleOpenAddRelative}
          onSelectPerson={(p) => {
            if (drawerPerson) {
              setDrawerHistory((prev) => [...prev, drawerPerson]);
            }
            setDrawerPerson(p);
          }}
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
          onSelectPerson={(p) => {
            setDrawerSource('LUNAR');
            setDrawerHistory([]);
            setShowLunarModal(false);
            setDrawerPerson(p);
          }}
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
        onSelectPerson={(p) => {
          setDrawerSource('REMINDER');
          setDrawerHistory([]);
          setShowReminderModal(false);
          setDrawerPerson(p);
        }}
      />

      {/* Smart Person Picker Modal */}
      {showPersonPicker && tree && (
        <PersonPickerModal
          isOpen={showPersonPicker}
          tree={tree}
          mePerson={mePerson}
          initialMode={personPickerMode}
          onSelectPerson={handleSelectPerspective}
          onViewPerson={(p) => {
            // Khi tìm kiếm thành viên từ sơ đồ cây, chuyển góc nhìn / cuộn mượt tới vị trí người đó trong sơ đồ
            if (mainView !== 'TREE') {
              setMainView('TREE');
            }
            setFocusPersonId(p.id);
            toast.info(`Đang chuyển đến vị trí: ${p.fullName}`);
          }}
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

      {/* Share Tree Modal */}
      {(sharingTree || tree) && (
        <ShareTreeModal
          isOpen={showShareModal}
          tree={sharingTree || tree!}
          currentUserRole={(sharingTree || tree)!.userRole || 'OWNER'}
          onClose={() => {
            setShowShareModal(false);
            setSharingTree(null);
          }}
          onNeedUpdatePhone={() => {
            setShowShareModal(false);
            setShowUpdatePhoneModal(true);
          }}
        />
      )}

      {/* Rename Tree Modal */}
      <RenameTreeModal
        isOpen={showRenameTreeModal}
        tree={renamingTree}
        onClose={() => {
          setShowRenameTreeModal(false);
          setRenamingTree(null);
        }}
        onSuccess={handleRenameSuccess}
      />

      {/* Create Tree Modal */}
      <CreateTreeModal
        isOpen={showCreateTreeModal}
        onClose={() => setShowCreateTreeModal(false)}
        onSuccess={handleTreeCreated}
        onOpenSubscriptionModal={() => setShowSubscriptionModal(true)}
        canCreateMore={subscriptionStatus?.canCreateMore ?? (allTrees.length < 5)}
        currentCount={allTrees.length}
        maxFree={subscriptionStatus?.maxFreeBranches ?? 5}
        isPro={subscriptionStatus?.tier === 'PRO'}
      />

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        status={subscriptionStatus}
        user={user}
        onClose={() => setShowSubscriptionModal(false)}
        onRefreshStatus={async () => {
          await refreshTreesAndSubscription();
          if (tree) await loadTreeData(tree.id);
        }}
      />

      {/* Invitations Notification Modal */}
      <InvitationNotificationModal
        isOpen={showInvitationsModal}
        invitations={pendingInvitations}
        onClose={() => setShowInvitationsModal(false)}
        onRefresh={loadPendingInvitations}
        onAcceptedTree={async (treeId) => {
          await loadTreeData(treeId);
          await loadPendingInvitations();
        }}
      />

      {/* Direct Invite Link Join Modal */}
      <InviteLinkJoinModal
        isOpen={showInviteLinkModal}
        inviteInfo={inviteLinkInfo}
        onClose={() => {
          setShowInviteLinkModal(false);
          setInviteLinkInfo(null);
          sessionStorage.removeItem('famlykin_pending_invite_tree');
          window.history.replaceState(null, '', window.location.pathname);
        }}
        onJoined={async (treeId) => {
          setShowInviteLinkModal(false);
          setInviteLinkInfo(null);
          sessionStorage.removeItem('famlykin_pending_invite_tree');
          window.history.replaceState(null, '', window.location.pathname);
          await refreshTreesAndSubscription();
          await loadTreeData(treeId, user);
          setMainView('TREE');
        }}
        onOpenSubscriptionModal={() => setShowSubscriptionModal(true)}
      />

      {/* Update Phone Modal */}
      <UpdatePhoneModal
        isOpen={showUpdatePhoneModal}
        currentUser={user}
        onClose={() => setShowUpdatePhoneModal(false)}
        onSuccess={(updatedUser) => {
          setUser(updatedUser);
        }}
      />

      {/* Account Restore Blocking Fullscreen Overlay (Grace period 30 days) */}
      {user && user.status === 'PENDING_DELETE' && (
        <AccountRestoreOverlay
          user={user}
          onRestored={(restoredUser) => {
            setUser(restoredUser);
            toast.success('Khôi phục tài khoản thành công! Bạn có thể tiếp tục sử dụng hệ thống.');
          }}
          onLogout={handleLogout}
        />
      )}

      {/* User Profile Modal (Edit Name, Phone, Avatar, Password & Soft Delete) */}
      <UserProfileModal
        isOpen={showProfileModal}
        currentUser={user}
        onClose={() => setShowProfileModal(false)}
        onUserUpdated={(updatedUser) => {
          setUser(updatedUser);
        }}
        onAccountClosed={() => {
          setShowProfileModal(false);
          handleLogout();
        }}
      />

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          onSuccess={handleAuthSuccess}
          resetToken={resetPasswordToken}
          onClearResetToken={() => setResetPasswordToken(null)}
        />
      )}
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
