import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Scan,
  Sparkles,
  Users,
  Compass,
  ArrowUpCircle,
  Eye,
  Layers,
  ChevronUp,
  ChevronDown,
  UserPlus,
  Crown,
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { Person, Relationship, FamilyTree } from '../types';
import { MemberCard } from './MemberCard';
import { getKinshipToMe, getPaternalMaternalMemberIds } from '../utils/kinshipHelper';

interface TreeCanvasProps {
  tree: FamilyTree;
  mePerson: Person | null;
  branchFilter?: 'ALL' | 'PATERNAL' | 'MATERNAL';
  onBranchFilterChange?: (filter: 'ALL' | 'PATERNAL' | 'MATERNAL') => void;
  viewMode?: 'COMPACT' | 'DETAILED';
  onViewModeChange?: (mode: 'COMPACT' | 'DETAILED') => void;
  onOpenPersonPicker?: () => void;
  onSelectPerson: (person: Person) => void;
  exportTrigger: number;
  onExportDone: () => void;
  focusPersonId?: string | null;
  onClearFocusPerson?: () => void;
  onOpenAddMember?: () => void;
  onStartTutorial?: () => void;
  onOpenAdmin?: () => void;
}

interface LineConnector {
  id: string;
  parentId?: string;
  spouseParentId?: string;
  childId?: string;
  childIds?: string[];
  d: string;
  hasArrow?: boolean;
}

interface GenerationUnit {
  type: 'COUPLE' | 'SINGLE';
  branch?: 'PATERNAL' | 'MATERNAL' | 'BOTH';
  person1: Person;
  person2?: Person;
}

export const TreeCanvas: React.FC<TreeCanvasProps> = ({
  tree,
  mePerson,
  branchFilter = 'ALL',
  onBranchFilterChange,
  viewMode = 'DETAILED',
  onViewModeChange,
  onOpenPersonPicker,
  onSelectPerson,
  exportTrigger,
  onExportDone,
  focusPersonId,
  onClearFocusPerson,
  onOpenAddMember,
  onStartTutorial,
  onOpenAdmin,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const treeContentRef = useRef<HTMLDivElement>(null);

  // Pan & Zoom state
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [touchPinchStart, setTouchPinchStart] = useState<{ dist: number; scale: number } | null>(null);

  // Floating controls mobile expansion toggle
  const [isControlsExpanded, setIsControlsExpanded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Lineage Connectors state
  const [connectors, setConnectors] = useState<LineConnector[]>([]);
  const [hoveredPersonId, setHoveredPersonId] = useState<string | null>(null);
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);

  // Helper to get exact unscaled coordinates of an element relative to treeContentRef
  const getOffsetInContent = useCallback((el: HTMLElement, container: HTMLElement) => {
    const cRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    // Compute actual rendered scale factor between screen pixels and container coordinate system
    const actualScaleX = container.offsetWidth > 0 ? cRect.width / container.offsetWidth : 1;
    const actualScaleY = container.offsetHeight > 0 ? cRect.height / container.offsetHeight : 1;
    const safeScaleX = actualScaleX > 0.02 ? actualScaleX : 1;
    const safeScaleY = actualScaleY > 0.02 ? actualScaleY : 1;

    return {
      left: (elRect.left - cRect.left) / safeScaleX,
      top: (elRect.top - cRect.top) / safeScaleY,
      width: elRect.width / safeScaleX,
      height: elRect.height / safeScaleY,
    };
  }, []);


  // Clamp position so the tree canvas never completely disappears offscreen
  const clampPosition = useCallback(
    (x: number, y: number, currentScale: number) => {
      if (!containerRef.current || !treeContentRef.current) return { x, y };

      const cW = containerRef.current.clientWidth || window.innerWidth;
      const cH = containerRef.current.clientHeight || window.innerHeight;
      const contentW = Math.max(treeContentRef.current.offsetWidth, treeContentRef.current.scrollWidth, 720);
      const contentH = Math.max(treeContentRef.current.offsetHeight, treeContentRef.current.scrollHeight, 480);

      const scaledW = contentW * currentScale;
      const scaledH = contentH * currentScale;

      // Ensure at least 180px or 30% of content remains visible on screen
      const minVisibleX = Math.min(180, scaledW * 0.35);
      const minVisibleY = Math.min(120, scaledH * 0.35);

      const minX = -(scaledW - minVisibleX);
      const maxX = cW - minVisibleX;
      const minY = -(scaledH - minVisibleY);
      const maxY = cH - minVisibleY;

      return {
        x: Math.max(minX, Math.min(x, maxX)),
        y: Math.max(minY, Math.min(y, maxY)),
      };
    },
    []
  );

  // Smooth animation helper for pan & zoom transitions (250-350ms)
  const animatePanZoom = useCallback(
    (targetX: number, targetY: number, targetScale: number, durationMs = 280) => {
      const startX = position.x;
      const startY = position.y;
      const startScale = scale;
      const startTime = performance.now();

      // Clamp target destination
      const clamped = clampPosition(targetX, targetY, targetScale);
      const finalTargetX = clamped.x;
      const finalTargetY = clamped.y;

      const easeOutQuad = (t: number) => t * (2 - t);

      const step = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / durationMs, 1);
        const eased = easeOutQuad(progress);

        setPosition({
          x: startX + (finalTargetX - startX) * eased,
          y: startY + (finalTargetY - startY) * eased,
        });
        setScale(startScale + (targetScale - startScale) * eased);

        if (progress < 1) {
          requestAnimationFrame(step);
        }
      };

      requestAnimationFrame(step);
    },
    [position, scale, clampPosition]
  );

  // Zoom smoothly centered around a given point (default = viewport center)
  const zoomAroundPoint = useCallback((factor: number, clientX?: number, clientY?: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const originX = clientX !== undefined ? clientX - rect.left : rect.width / 2;
    const originY = clientY !== undefined ? clientY - rect.top : rect.height / 2;

    const isMobile = window.innerWidth < 768;
    // Balanced zoom range: prevent zooming out too far into dots, keep readable
    const minScale = isMobile ? 0.52 : 0.45;
    const maxScale = 1.9;

    setScale((oldScale) => {
      const newScale = Math.max(minScale, Math.min(oldScale * factor, maxScale));
      // Even if near boundary, allow small steps
      if (Math.abs(newScale - oldScale) < 0.001) return oldScale;

      setPosition((prevPos) => {
        const canvasX = (originX - prevPos.x) / oldScale;
        const canvasY = (originY - prevPos.y) / oldScale;
        const rawX = originX - canvasX * newScale;
        const rawY = originY - canvasY * newScale;
        return clampPosition(rawX, rawY, newScale);
      });

      return newScale;
    });
  }, [clampPosition]);

  const zoomIn = () => zoomAroundPoint(1.2);
  const zoomOut = () => zoomAroundPoint(0.85);


  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    zoomAroundPoint(factor, e.clientX, e.clientY);
  };

  // Fit to screen function: centers and scales tree to perfectly fit screen
  // On Mobile (<768px): Uses Smart Focus centered on mePerson/immediate family
  const fitToScreen = useCallback(() => {
    if (!containerRef.current || !treeContentRef.current) return;

    const container = containerRef.current;
    const content = treeContentRef.current;

    const containerW = container.clientWidth || window.innerWidth;
    const containerH = container.clientHeight || (window.innerHeight - 80);

    const isMobile = containerW < 768;

    // Smart Focus on Mobile:
    // Focus directly on mePerson (or central generation) with readable scale (0.85)
    // without forcing extreme zoom-out that breaks card fonts.
    if (isMobile) {
      const targetPerson = mePerson || tree.members.find((m) => m.generation === 3) || tree.members[0];
      if (targetPerson) {
        const targetEl = content.querySelector(`[data-person-id="${targetPerson.id}"]`) as HTMLElement;
        if (targetEl) {
          const box = getOffsetInContent(targetEl, content);
          const mobileScale = 0.85;
          const targetX = containerW / 2 - (box.left + box.width / 2) * mobileScale;
          const targetY = containerH / 2 - (box.top + box.height / 2) * mobileScale;
          setScale(mobileScale);
          setPosition({ x: targetX, y: targetY });
          return;
        }
      }
    }

    const contentW = Math.max(content.scrollWidth, content.offsetWidth, 720);
    const contentH = Math.max(content.scrollHeight, content.offsetHeight, 480);

    const paddingX = isMobile ? 14 : 28;
    const paddingY = isMobile ? 16 : 28;

    const availableW = containerW - paddingX * 2;
    const availableH = containerH - paddingY * 2;

    const scaleX = availableW / contentW;
    const scaleY = availableH / contentH;

    let targetScale = isMobile
      ? Math.min(scaleX, scaleY * 1.05, 1.0)
      : Math.min(scaleX, scaleY, 1.0);

    const minScale = isMobile ? 0.52 : 0.45;
    targetScale = Math.max(minScale, Math.min(targetScale, 1.05));

    const scaledWidth = contentW * targetScale;
    const targetX = Math.max(paddingX, (containerW - scaledWidth) / 2);

    const scaledHeight = contentH * targetScale;
    const targetY = containerH > scaledHeight
      ? Math.max(paddingY, (containerH - scaledHeight) / 2)
      : paddingY;

    setScale(targetScale);
    setPosition({ x: targetX, y: targetY });
  }, [mePerson, tree.members]);

  // Pan to a specific person (with optional customScale)
  const panToPerson = useCallback(
    (personId: string, customScale?: number) => {
      if (!containerRef.current || !treeContentRef.current) return;

      const container = containerRef.current;
      const content = treeContentRef.current;
      const targetEl = content.querySelector(`[data-person-id="${personId}"]`) as HTMLElement;

      if (!targetEl) return;

      const box = getOffsetInContent(targetEl, content);
      const cW = container.clientWidth;
      const cH = container.clientHeight;

      // Target comfortable reading scale
      const isMobile = cW < 768;
      const targetScale = customScale || (isMobile ? 0.85 : Math.max(scale, 0.95));
      const targetX = cW / 2 - (box.left + box.width / 2) * targetScale;
      const targetY = cH / 2 - (box.top + box.height / 2) * targetScale;

      animatePanZoom(targetX, targetY, targetScale, 300);

      // Flash highlight ring
      setHighlightedNodeId(personId);
      setTimeout(() => {
        setHighlightedNodeId(null);
      }, 2500);
    },
    [scale, animatePanZoom]
  );

  // Double tap on card: automatically pan and zoom centered on that card
  const handleCardDoubleTap = useCallback(
    (person: Person) => {
      const isMobile = (containerRef.current?.clientWidth || window.innerWidth) < 768;
      const zoomScale = isMobile ? 1.1 : 1.05;
      panToPerson(person.id, zoomScale);
    },
    [panToPerson]
  );

  // Pan to Generation I (Top of Tree)
  const panToGenerationI = useCallback(() => {
    if (!containerRef.current || !treeContentRef.current) return;

    const container = containerRef.current;
    const content = treeContentRef.current;
    const topGenEl = content.querySelector('[data-generation="1"]') as HTMLElement;

    const cW = container.clientWidth;
    const targetScale = Math.max(scale, cW < 768 ? 0.7 : 0.9);

    if (topGenEl) {
      const box = getOffsetInContent(topGenEl, content);
      const targetX = cW / 2 - (box.left + box.width / 2) * targetScale;
      const targetY = 30;
      animatePanZoom(targetX, targetY, targetScale, 300);
    } else {
      const contentW = content.offsetWidth || 800;
      animatePanZoom(Math.max(10, (cW - contentW * targetScale) / 2), 30, targetScale, 300);
    }
  }, [scale, animatePanZoom]);

  // When focusPersonId prop triggers
  useEffect(() => {
    if (focusPersonId) {
      panToPerson(focusPersonId);
      onClearFocusPerson?.();
    }
  }, [focusPersonId, panToPerson, onClearFocusPerson]);

  // When mePerson changes, pan to me automatically
  useEffect(() => {
    if (mePerson) {
      const timer = setTimeout(() => {
        panToPerson(mePerson.id);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [mePerson?.id]);

  // Prevent browser native scrolling & pull-to-refresh while touching canvas
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const preventScroll = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        e.preventDefault();
      }
    };

    el.addEventListener('touchmove', preventScroll, { passive: false });
    return () => {
      el.removeEventListener('touchmove', preventScroll);
    };
  }, []);

  // Calculate SVG connector lines between parent(s) and child
  const calculateConnectors = useCallback(() => {
    if (!treeContentRef.current) return;
    const content = treeContentRef.current;

    const spouseRels = tree.relationships.filter((r) => r.type === 'SPOUSE');
    const parentChildRels = tree.relationships.filter((r) => r.type === 'PARENT_CHILD');

    // 1. Group children by their parental union (Family Unit)
    // Map of unionKey -> { parent1Id: string; parent2Id?: string; childIds: string[] }
    const unionsMap = new Map<string, { parent1Id: string; parent2Id?: string; childIds: string[] }>();

    // For each child, find all parentId(s)
    const childParentMap = new Map<string, string[]>();
    parentChildRels.forEach((rel) => {
      if (rel.childId && rel.parentId) {
        const list = childParentMap.get(rel.childId) || [];
        if (!list.includes(rel.parentId)) list.push(rel.parentId);
        childParentMap.set(rel.childId, list);
      }
    });

    childParentMap.forEach((parentIds, childId) => {
      const p1 = parentIds[0];
      let p2 = parentIds.length > 1 ? parentIds[1] : null;
      if (!p2) {
        const spRel = spouseRels.find(
          (r) => r.spouse1Id === p1 || r.spouse2Id === p1
        );
        if (spRel) {
          p2 = spRel.spouse1Id === p1 ? spRel.spouse2Id! : spRel.spouse1Id!;
        }
      }

      const unionKey = p2 ? [p1, p2].sort().join('___') : p1;
      let union = unionsMap.get(unionKey);
      if (!union) {
        union = { parent1Id: p1, parent2Id: p2 || undefined, childIds: [] };
        unionsMap.set(unionKey, union);
      }
      if (!union.childIds.includes(childId)) {
        union.childIds.push(childId);
      }
    });

    const newConnectors: LineConnector[] = [];

    unionsMap.forEach((union, unionKey) => {
      const p1El = content.querySelector(`[data-person-id="${union.parent1Id}"]`) as HTMLElement;
      const p2El = union.parent2Id
        ? (content.querySelector(`[data-person-id="${union.parent2Id}"]`) as HTMLElement)
        : null;

      if (!p1El && !p2El) return;

      let startX: number;
      let startY: number;

      const coupleFrame = ((p1El?.closest('.couple-card-frame') || p2El?.closest('.couple-card-frame')) as HTMLElement) || null;
      const marriageBadge = coupleFrame
        ? (coupleFrame.querySelector('.marriage-link-badge') as HTMLElement)
        : null;

      if (coupleFrame) {
        const frameBox = getOffsetInContent(coupleFrame, content);
        startX = frameBox.left + frameBox.width / 2;
        startY = frameBox.top + frameBox.height;
      } else if (marriageBadge) {
        const badgeBox = getOffsetInContent(marriageBadge, content);
        startX = badgeBox.left + badgeBox.width / 2;
        startY = badgeBox.top + badgeBox.height;
      } else if (p1El && p2El) {
        const p1Box = getOffsetInContent(p1El, content);
        const p2Box = getOffsetInContent(p2El, content);
        startX = (p1Box.left + p1Box.width / 2 + p2Box.left + p2Box.width / 2) / 2;
        startY = Math.max(p1Box.top + p1Box.height, p2Box.top + p2Box.height);
      } else if (p1El) {
        const p1Box = getOffsetInContent(p1El, content);
        startX = p1Box.left + p1Box.width / 2;
        startY = p1Box.top + p1Box.height;
      } else if (p2El) {
        const p2Box = getOffsetInContent(p2El, content);
        startX = p2Box.left + p2Box.width / 2;
        startY = p2Box.top + p2Box.height;
      } else {
        return;
      }

      // Collect visible children in DOM
      interface ChildInfo {
        id: string;
        endX: number;
        endY: number;
        top: number;
        gen?: number;
      }
      const visibleChildren: ChildInfo[] = [];

      union.childIds.forEach((childId) => {
        const childEl = content.querySelector(`[data-person-id="${childId}"]`) as HTMLElement;
        if (!childEl) return;
        const cBox = getOffsetInContent(childEl, content);
        const hasMeBadge = childEl.classList.contains('is-me') || childEl.querySelector('.me-badge');
        const endX = cBox.left + cBox.width / 2;
        const endY = hasMeBadge ? cBox.top - 8 : cBox.top - 2;

        const genContainer = childEl.closest('.generation-container') as HTMLElement;
        const genNum = genContainer?.getAttribute('data-generation')
          ? Number(genContainer.getAttribute('data-generation'))
          : undefined;

        visibleChildren.push({ id: childId, endX, endY, top: cBox.top, gen: genNum });
      });

      if (visibleChildren.length === 0) return;

      // Sort children from left to right
      visibleChildren.sort((a, b) => a.endX - b.endX);

      // Determine busY (midway between bottom of parent and top of children)
      const minChildTop = Math.min(...visibleChildren.map((c) => c.top));
      let busY = (startY + minChildTop) / 2;

      // If there is a generation divider between startY and minChildTop, align busY to the divider row
      const childGen = visibleChildren[0].gen;
      if (childGen) {
        const genDivider = content.querySelector(
          `[data-generation="${childGen}"] .generation-divider-row`
        ) as HTMLElement;
        if (genDivider) {
          const divBox = getOffsetInContent(genDivider, content);
          if (divBox.top > startY && divBox.top + divBox.height < minChildTop) {
            busY = divBox.top + divBox.height / 2;
          }
        }
      }

      if (visibleChildren.length === 1) {
        const c = visibleChildren[0];
        let d: string;
        if (Math.abs(startX - c.endX) < 8) {
          d = `M ${startX} ${startY} V ${c.endY}`;
        } else {
          d = `M ${startX} ${startY} V ${busY} H ${c.endX} V ${c.endY}`;
        }
        newConnectors.push({
          id: `conn-single-${c.id}`,
          parentId: union.parent1Id,
          spouseParentId: union.parent2Id,
          childId: c.id,
          d,
          hasArrow: true,
        });
      } else {
        const minChildX = visibleChildren[0].endX;
        const maxChildX = visibleChildren[visibleChildren.length - 1].endX;
        const busLeft = Math.min(startX, minChildX);
        const busRight = Math.max(startX, maxChildX);

        // 1. Trunk from parents & continuous horizontal bus connecting all siblings
        const trunkAndBusPath = `M ${startX} ${startY} V ${busY} M ${busLeft} ${busY} H ${busRight}`;
        newConnectors.push({
          id: `conn-bus-${unionKey}`,
          parentId: union.parent1Id,
          spouseParentId: union.parent2Id,
          childIds: visibleChildren.map((c) => c.id),
          d: trunkAndBusPath,
          hasArrow: false,
        });

        // 2. Vertical drop lines with arrow for every child
        visibleChildren.forEach((child) => {
          const dropPath = `M ${child.endX} ${busY} V ${child.endY}`;
          newConnectors.push({
            id: `conn-drop-${child.id}`,
            parentId: union.parent1Id,
            spouseParentId: union.parent2Id,
            childId: child.id,
            d: dropPath,
            hasArrow: true,
          });
        });
      }
    });

    setConnectors(newConnectors);
  }, [tree.relationships, getOffsetInContent]);

  // Recalculate connectors after DOM updates and filter switches
  useEffect(() => {
    calculateConnectors();
    const t1 = setTimeout(calculateConnectors, 60);
    const t2 = setTimeout(calculateConnectors, 180);
    const t3 = setTimeout(calculateConnectors, 350);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [tree.id, branchFilter, viewMode, calculateConnectors]);

  // Initial Auto-fit on mount or when tree.id changes, and on window resize
  const isInitialFitDone = useRef(false);
  useEffect(() => {
    // Only fit to screen on initial tree load or if switching to another tree
    const timer1 = setTimeout(() => {
      fitToScreen();
      isInitialFitDone.current = true;
    }, 80);

    const timer2 = setTimeout(() => {
      calculateConnectors();
    }, 280);

    const handleResize = () => {
      calculateConnectors();
    };

    window.addEventListener('resize', handleResize);

    // ResizeObserver on tree content container to auto update connector lines when dimensions change
    let resizeObserver: ResizeObserver | null = null;
    if (treeContentRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        calculateConnectors();
      });
      resizeObserver.observe(treeContentRef.current);
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [tree.id]);

  // Handle Pan (Mouse)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (
      (e.target as HTMLElement).closest('.minimal-card') ||
      (e.target as HTMLElement).closest('button') ||
      (e.target as HTMLElement).closest('.canvas-fixed-breadcrumb')
    ) {
      return;
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const rawX = e.clientX - dragStart.x;
    const rawY = e.clientY - dragStart.y;
    setPosition(clampPosition(rawX, rawY, scale));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle Pan & Pinch-to-Zoom (Touch for Mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (
      (e.target as HTMLElement).closest('.minimal-card') ||
      (e.target as HTMLElement).closest('button') ||
      (e.target as HTMLElement).closest('.minimal-controls') ||
      (e.target as HTMLElement).closest('.canvas-fixed-breadcrumb')
    ) {
      return;
    }
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y });
      setTouchPinchStart(null);
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setTouchPinchStart({ dist, scale });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      const rawX = e.touches[0].clientX - dragStart.x;
      const rawY = e.touches[0].clientY - dragStart.y;
      setPosition(clampPosition(rawX, rawY, scale));
    } else if (e.touches.length === 2 && touchPinchStart) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (touchPinchStart.dist > 0) {
        const factor = currentDist / touchPinchStart.dist;
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        zoomAroundPoint(factor, midX, midY);
        setTouchPinchStart({ dist: currentDist, scale });
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setTouchPinchStart(null);
  };

  const resetView = () => {
    setScale(1);
    if (containerRef.current && treeContentRef.current) {
      const containerW = containerRef.current.clientWidth;
      const contentW = treeContentRef.current.offsetWidth || 800;
      setPosition({ x: Math.max(10, (containerW - contentW) / 2), y: 30 });
    } else {
      setPosition({ x: 20, y: 30 });
    }
  };

  // High-res Image Export
  useEffect(() => {
    if (exportTrigger > 0 && treeContentRef.current) {
      exportTreeImage();
    }
  }, [exportTrigger]);

  const exportTreeImage = async () => {
    if (!treeContentRef.current) return;
    setIsExporting(true);
    // Allow React state to flush and display progress overlay
    await new Promise((resolve) => setTimeout(resolve, 80));
    try {
      const dataUrl = await toPng(treeContentRef.current, {
        pixelRatio: 2.5,
        backgroundColor: '#fbfbfd',
        cacheBust: true,
      });

      const link = document.createElement('a');
      const safeName = tree.name.replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_');
      link.download = `${safeName}_CayGiaPha_HD.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Lỗi khi xuất ảnh gia phả:', err);
    } finally {
      setIsExporting(false);
      onExportDone();
    }
  };

  // Classify members into Paternal (Bên Nội) or Maternal (Bên Ngoại)
  const { paternalMemberIds, maternalMemberIds } = useMemo(() => {
    const activeObserver = (focusPersonId ? tree.members.find((m) => m.id === focusPersonId) : null) || mePerson;
    return getPaternalMaternalMemberIds(activeObserver, tree.members, tree.relationships);
  }, [tree.members, tree.relationships, mePerson, focusPersonId]);

  // Group members by Generation and sort with couple grouping and branch separation
  const { sortedGenerations, generationUnitsMap, visibleMembersCount } = useMemo(() => {
    const filteredMembers = tree.members.filter((m) => {
      if (branchFilter === 'ALL') return true;
      if (branchFilter === 'PATERNAL') return paternalMemberIds.has(m.id);
      if (branchFilter === 'MATERNAL') return maternalMemberIds.has(m.id);
      return true;
    });

    const genMap = new Map<number, Person[]>();
    filteredMembers.forEach((person) => {
      const gen = person.generation || 1;
      if (!genMap.has(gen)) {
        genMap.set(gen, []);
      }
      genMap.get(gen)!.push(person);
    });

    const sortedGens = Array.from(genMap.keys()).sort((a, b) => a - b);
    const unitsMap = new Map<number, GenerationUnit[]>();
    const spousePairs = tree.relationships.filter((r) => r.type === 'SPOUSE');

    sortedGens.forEach((gen) => {
      const members = genMap.get(gen) || [];
      const visited = new Set<string>();
      const units: GenerationUnit[] = [];

      members.forEach((person) => {
        if (visited.has(person.id)) return;

        const spRel = spousePairs.find(
          (r) => r.spouse1Id === person.id || r.spouse2Id === person.id
        );

        if (spRel) {
          const spouseId = spRel.spouse1Id === person.id ? spRel.spouse2Id : spRel.spouse1Id;
          // Tìm người bạn đời trong danh sách thế hệ hiện tại, hoặc toàn bộ filteredMembers, hoặc tree.members
          let spousePerson = members.find((m) => m.id === spouseId);
          if (!spousePerson) {
            spousePerson =
              filteredMembers.find((m) => m.id === spouseId) ||
              tree.members.find((m) => m.id === spouseId);
          }

          if (spousePerson && !visited.has(spousePerson.id)) {
            visited.add(person.id);
            visited.add(spousePerson.id);

            let branch: 'PATERNAL' | 'MATERNAL' | 'BOTH' = 'BOTH';
            if (paternalMemberIds.has(person.id) && !maternalMemberIds.has(person.id)) {
              branch = 'PATERNAL';
            } else if (maternalMemberIds.has(person.id) && !paternalMemberIds.has(person.id)) {
              branch = 'MATERNAL';
            }

            // Chuẩn hóa vị trí: Chồng ở bên trái (person1), Vợ ở bên phải (person2)
            const p1 =
              person.gender === 'FEMALE' && spousePerson.gender === 'MALE' ? spousePerson : person;
            const p2 = p1 === person ? spousePerson : person;

            units.push({
              type: 'COUPLE',
              branch,
              person1: p1,
              person2: p2,
            });
            return;
          }
        }

        visited.add(person.id);
        let branch: 'PATERNAL' | 'MATERNAL' | 'BOTH' = 'BOTH';
        if (paternalMemberIds.has(person.id) && !maternalMemberIds.has(person.id)) {
          branch = 'PATERNAL';
        } else if (maternalMemberIds.has(person.id) && !paternalMemberIds.has(person.id)) {
          branch = 'MATERNAL';
        }

        units.push({
          type: 'SINGLE',
          branch,
          person1: person,
        });
      });

      // Sort units in generation: Paternal left, Maternal right
      units.sort((a, b) => {
        const order = { PATERNAL: 1, BOTH: 2, MATERNAL: 3 };
        return (order[a.branch || 'BOTH'] || 2) - (order[b.branch || 'BOTH'] || 2);
      });

      unitsMap.set(gen, units);
    });

    return {
      sortedGenerations: sortedGens,
      generationUnitsMap: unitsMap,
      visibleMembersCount: filteredMembers.length,
    };
  }, [tree.members, tree.relationships, branchFilter, paternalMemberIds, maternalMemberIds]);

  const toRoman = (num: number) => {
    const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    return romans[num - 1] || `${num}`;
  };

  const isCompactMode = viewMode === 'COMPACT';

  return (
    <div
      ref={containerRef}
      className="canvas-wrapper"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >

      {/* 2. Infinite Canvas Plane */}
      <div
        className="canvas-plane"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
        }}
      >
        <div ref={treeContentRef} className="tree-content-container">
          {/* SVG Lineage Connectors */}
          <svg className="tree-svg-layer" aria-hidden="true">
            <defs>
              <linearGradient id="bloodline-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#34d399" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#0d9488" stopOpacity="0.65" />
              </linearGradient>
              <linearGradient id="highlight-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#6ee7b7" stopOpacity="1" />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.95" />
              </linearGradient>

              {/* Mũi tên chĩa xuống thế hệ con */}
              <marker
                id="tree-arrow"
                viewBox="0 0 10 10"
                refX="5"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#10b981" />
              </marker>

              <marker
                id="tree-arrow-hovered"
                viewBox="0 0 10 10"
                refX="5"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#fbbf24" />
              </marker>
            </defs>

            {connectors.map((c) => {
              const isHovered =
                hoveredPersonId &&
                (hoveredPersonId === c.parentId ||
                  hoveredPersonId === c.spouseParentId ||
                  hoveredPersonId === c.childId ||
                  (c.childIds && c.childIds.includes(hoveredPersonId)));

              return (
                <path
                  key={c.id}
                  d={c.d}
                  fill="none"
                  stroke={isHovered ? '#fbbf24' : '#10b981'}
                  strokeWidth={isHovered ? 3.5 : 2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  markerEnd={
                    c.hasArrow !== false
                      ? isHovered
                        ? 'url(#tree-arrow-hovered)'
                        : 'url(#tree-arrow)'
                      : undefined
                  }
                  className={isHovered ? 'tree-path-hovered' : 'tree-path'}
                  style={{
                    transition: 'stroke 0.2s, stroke-width 0.2s',
                  }}
                />
              );
            })}
          </svg>

          {/* 1. Empty Tree: Brand New Family Tree without members */}
          {tree.members.length === 0 ? (
            <div className="canvas-empty-branch">
              <div className="empty-tree-card">
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(6, 78, 59, 0.4) 100%)',
                    border: '1px solid rgba(52, 211, 153, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 24px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <Sparkles size={32} color="#fef08a" />
                </div>
                <h3>Chào Mừng Đến Với Fam3!</h3>
                <p>
                  Cây gia phả của bạn đang sẵn sàng. Hãy bắt đầu khởi tạo thành viên đầu tiên (Cụ Thủy Tổ hoặc Bản Thân bạn) để xây dựng phả hệ trường tồn.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}>
                  {onOpenAddMember && (
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={onOpenAddMember}
                      style={{ padding: '0.75rem 1.4rem', fontSize: '0.92rem' }}
                    >
                      <UserPlus size={18} />
                      <span>+ Thêm Thành Viên Đầu Tiên</span>
                    </button>
                  )}
                  {onStartTutorial && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={onStartTutorial}
                      style={{ padding: '0.75rem 1.2rem', fontSize: '0.92rem' }}
                    >
                      <Compass size={17} color="#34d399" />
                      <span>Xem Hướng Dẫn Bắt Đầu</span>
                    </button>
                  )}
                  {onOpenAdmin && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={onOpenAdmin}
                      style={{
                        padding: '0.75rem 1.2rem',
                        fontSize: '0.92rem',
                        borderColor: 'rgba(245, 158, 11, 0.6)',
                        color: '#fbbf24',
                        background: 'rgba(245, 158, 11, 0.12)',
                      }}
                    >
                      <Crown size={17} color="#fbbf24" />
                      <span>Mở Admin Dashboard</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : visibleMembersCount === 0 ? (
            /* 2. Empty Branch: When branch filter yields no members */
            <div className="canvas-empty-branch">
              <div className="empty-branch-card">
                <Users size={32} color="#34d399" />
                <h3>Chưa có thành viên trong nhánh này</h3>
                <p>Nhánh phả hệ đang lọc chưa có thành viên tương ứng.</p>
                {onBranchFilterChange && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => onBranchFilterChange('ALL')}
                  >
                    Xem Cả Hai Bên (Nội & Ngoại)
                  </button>
                )}
              </div>
            </div>
          ) : null}

          {/* Generations Tree Render */}
          {sortedGenerations.map((genNumber) => {
            const units = generationUnitsMap.get(genNumber) || [];
            const membersCount = tree.members.filter((m) => m.generation === genNumber).length;

            return (
              <div
                key={genNumber}
                data-generation={genNumber}
                className="generation-container"
              >
                {/* Generation Divider */}
                <div className="generation-divider-row">
                  <div className="gen-line-left" />
                  <span className="generation-label">
                    Thế Hệ {toRoman(genNumber)} ({membersCount})
                  </span>
                  <div className="gen-line-right" />
                </div>

                {/* Units List in this Generation */}
                <div className="generation-units-row" key={`gen-units-${genNumber}-${branchFilter}`}>
                  {units.map((unit) => {
                    if (unit.type === 'COUPLE' && unit.person2) {
                      const p1 = unit.person1;
                      const p2 = unit.person2;

                      const kin1 = getKinshipToMe(mePerson, p1, tree.members, tree.relationships);
                      const kin2 = getKinshipToMe(mePerson, p2, tree.members, tree.relationships);

                      const isMe1 = Boolean(mePerson && mePerson.id === p1.id);
                      const isMe2 = Boolean(mePerson && mePerson.id === p2.id);

                      const isHighlighted1 = hoveredPersonId === p1.id || highlightedNodeId === p1.id;
                      const isHighlighted2 = hoveredPersonId === p2.id || highlightedNodeId === p2.id;

                      const isPaternal = unit.branch === 'PATERNAL';
                      const isMaternal = unit.branch === 'MATERNAL';

                      return (
                        <div
                          key={`couple-${p1.id}-${p2.id}-${branchFilter}`}
                          className="couple-unit-container filter-animate-enter"
                        >
                          {/* Branch badge for Gen 1 (Ông bà nội / ngoại) hoặc Ba Mẹ (Gen 2) */}
                          {genNumber === 1 ? (
                            <span
                              className={`branch-family-pill ${
                                isPaternal ? 'paternal' : isMaternal ? 'maternal' : 'neutral'
                              }`}
                            >
                              {isPaternal
                                ? 'Ông Bà Nội'
                                : isMaternal
                                ? 'Ông Bà Ngoại'
                                : 'Đôi Bạn Đời (Thủy Tổ)'}
                            </span>
                          ) : (
                            // Kiểm tra nếu cặp đôi này là Ba Mẹ của "Tôi" (hoặc có vai vế là Bố / Mẹ)
                            ((kin1.includes('Bố') || kin1.includes('Mẹ')) && (kin2.includes('Bố') || kin2.includes('Mẹ'))) ||
                            (mePerson && (p1.id === mePerson.id || p2.id === mePerson.id) ? false : false) ? (
                              <span className="branch-family-pill parents">
                                Ba Mẹ
                              </span>
                            ) : null
                          )}

                          <div
                            className={`couple-card-frame ${
                              isPaternal ? 'frame-paternal' : isMaternal ? 'frame-maternal' : ''
                            }`}
                          >
                            <MemberCard
                              person={p1}
                              kinshipTitle={kin1}
                              isMe={isMe1}
                              isHighlighted={isHighlighted1}
                              isCompact={isCompactMode}
                              onClick={onSelectPerson}
                              onDoubleTap={handleCardDoubleTap}
                              onMouseEnter={(p) => setHoveredPersonId(p.id)}
                              onMouseLeave={() => setHoveredPersonId(null)}
                            />

                            {/* Marriage Rings Link Indicator */}
                            <div
                              className="marriage-link-badge"
                              title={`Quan hệ Hôn Nhân: ${p1.fullName} ⚭ ${p2.fullName}`}
                              aria-label="Quan hệ hôn nhân"
                            >
                              ⚭
                            </div>

                            <MemberCard
                              person={p2}
                              kinshipTitle={kin2}
                              isMe={isMe2}
                              isHighlighted={isHighlighted2}
                              isCompact={isCompactMode}
                              onClick={onSelectPerson}
                              onDoubleTap={handleCardDoubleTap}
                              onMouseEnter={(p) => setHoveredPersonId(p.id)}
                              onMouseLeave={() => setHoveredPersonId(null)}
                            />
                          </div>
                        </div>
                      );
                    }

                    // Single member
                    const p = unit.person1;
                    const kin = getKinshipToMe(mePerson, p, tree.members, tree.relationships);
                    const isMe = Boolean(mePerson && mePerson.id === p.id);
                    const isHighlighted = hoveredPersonId === p.id || highlightedNodeId === p.id;

                    return (
                      <div
                        key={`single-${p.id}-${branchFilter}`}
                        className="single-unit-container filter-animate-enter"
                        style={{ display: 'inline-flex' }}
                      >
                        <MemberCard
                          person={p}
                          kinshipTitle={kin}
                          isMe={isMe}
                          isHighlighted={isHighlighted}
                          isCompact={isCompactMode}
                          onClick={onSelectPerson}
                          onDoubleTap={handleCardDoubleTap}
                          onMouseEnter={(person) => setHoveredPersonId(person.id)}
                          onMouseLeave={() => setHoveredPersonId(null)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Vertical Floating Controls Column (Elderly-Friendly & Mobile Collapsible) */}
      <div className="minimal-controls-vertical" role="toolbar" aria-label="Điều khiển bản đồ gia phả">
        {/* Fit to screen (Always prominent) */}
        <button
          type="button"
          className="ctrl-btn-vertical primary-fit"
          onClick={fitToScreen}
          aria-label="Căn vừa toàn bộ cây gia phả vào màn hình"
          title="Căn vừa toàn bộ cây gia phả vào màn hình"
        >
          <Scan size={18} />
          <span className="ctrl-btn-label">Căn vừa</span>
        </button>

        {/* Collapsible Mobile Control Group or Full Desktop View */}
        <div className={`controls-sub-group ${isControlsExpanded ? 'expanded' : ''}`}>
          {/* Zoom In */}
          <button
            type="button"
            className="ctrl-btn-vertical"
            onClick={zoomIn}
            aria-label="Phóng to"
            title="Phóng to (+)"
          >
            <ZoomIn size={18} />
          </button>

          {/* Zoom Out */}
          <button
            type="button"
            className="ctrl-btn-vertical"
            onClick={zoomOut}
            aria-label="Thu nhỏ"
            title="Thu nhỏ (-)"
          >
            <ZoomOut size={18} />
          </button>

          {/* 100% Reset */}
          <button
            type="button"
            className="ctrl-btn-vertical"
            onClick={resetView}
            aria-label="Về kích thước gốc 100%"
            title="Về kích thước gốc 100%"
          >
            <RotateCcw size={16} />
          </button>

          {/* Về vị trí của tôi */}
          {mePerson && (
            <button
              type="button"
              className="ctrl-btn-vertical"
              onClick={() => panToPerson(mePerson.id)}
              aria-label="Về vị trí của tôi"
              title="Về vị trí của tôi (Gốc nhìn)"
            >
              <Compass size={17} color="#38bdf8" />
            </button>
          )}

          {/* Chuyển đổi Gọn / Chi tiết (Hỗ trợ mobile tiện lợi ngay trên thanh điều khiển) */}
          {onViewModeChange && (
            <button
              type="button"
              className={`ctrl-btn-vertical ${viewMode === 'COMPACT' ? 'active-viewmode' : ''}`}
              onClick={() => onViewModeChange(viewMode === 'COMPACT' ? 'DETAILED' : 'COMPACT')}
              aria-label={viewMode === 'COMPACT' ? 'Đổi sang hiển thị Chi tiết' : 'Đổi sang hiển thị Gọn'}
              title={viewMode === 'COMPACT' ? 'Đang ở chế độ Gọn (Bấm để xem Chi tiết)' : 'Đang ở chế độ Chi tiết (Bấm để xem Gọn)'}
            >
              {viewMode === 'COMPACT' ? <Eye size={17} color="#34d399" /> : <Layers size={17} color="#60a5fa" />}
            </button>
          )}

          {/* Về Thế hệ I */}
          <button
            type="button"
            className="ctrl-btn-vertical"
            onClick={panToGenerationI}
            aria-label="Về thế hệ I (Đầu cây)"
            title="Về thế hệ I (Thủy tổ/Đầu cây)"
          >
            <ArrowUpCircle size={17} color="#c084fc" />
          </button>
        </div>

        {/* Mobile Expansion Toggle Button */}
        <button
          type="button"
          className="ctrl-mobile-toggle"
          onClick={() => setIsControlsExpanded(!isControlsExpanded)}
          aria-label={isControlsExpanded ? 'Thu gọn điều khiển' : 'Mở rộng điều khiển'}
        >
          {isControlsExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>

      {/* 5. HD Export Progress Overlay */}
      {isExporting && (
        <div className="canvas-exporting-overlay">
          <div className="canvas-exporting-card">
            <div className="canvas-exporting-spinner" />
            <h3 className="canvas-exporting-title">Đang Tạo Ảnh Cây Gia Phả HD...</h3>
            <p className="canvas-exporting-desc">
              Hệ thống đang kết xuất toàn bộ cây gia phả ở độ nét cao 2.5x.
              Vui lòng đợi trong giây lát để tải về.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
