import { BarChart3, FileText, Moon, Settings, Sun, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';
import { IssueReportModal } from './components/IssueReportModal';
import { SettingsModal } from './components/SettingsModal';
import { WeeklyReportModal } from './components/WeeklyReportModal';

import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';
import type { Locale } from './lib/i18n';
import { getTranslation } from './lib/i18n';



const isIssuePage = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /\/issues\/\d+/.test(window.location.pathname);
};

const isRedmineSite = (): boolean => {
  if (typeof window === 'undefined') return false;
  return true;
};

interface UsageInfo {
  resolvedDate: string;
  aiUsage: string;
}

const getUsageFromPage = (): UsageInfo | null => {
  try {
    let resolvedDate = '';
    let aiUsage = '';

    const inputs = document.querySelectorAll('input[type="text"], input[type="number"]');
    for (const input of inputs) {
      const row = input.closest('tr');
      const labelEl = row?.querySelector('th');
      const labelText = labelEl?.textContent?.trim() || '';
      const value = (input as HTMLInputElement).value;

      if (labelText.toLowerCase().includes('resolved') && labelText.toLowerCase().includes('date')) {
        resolvedDate = value;
      }
      if (labelText.toLowerCase().includes('usage')) {
        aiUsage = value.replace('%', '').trim();
      }
    }

    if (!aiUsage || !resolvedDate) {
      const rows = document.querySelectorAll('tr');
      for (const row of rows) {
        const ths = row.querySelectorAll('th');
        const tds = row.querySelectorAll('td');
        
        for (let i = 0; i < ths.length; i++) {
          const th = ths[i];
          const td = tds[i];
          if (!th || !td) continue;

          const labelText = th.textContent?.trim() || '';
          const value = td.textContent?.trim() || '';

          if (labelText.toLowerCase().includes('usage')) {
            aiUsage = value.replace('%', '').trim();
          }
          if (labelText.toLowerCase().includes('resolved') && labelText.toLowerCase().includes('date')) {
            resolvedDate = value;
          }
        }
      }
    }

    if (!resolvedDate && !aiUsage) return null;

    return { resolvedDate, aiUsage };
  } catch {
    return null;
  }
};

const FloatingBall = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [showIssueReport, setShowIssueReport] = useState(false);
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [usageWarning, setUsageWarning] = useState(false);
  const [locale, setLocale] = useState<Locale>(() => {
    const saved = localStorage.getItem('issuer-locale') as Locale;
    return saved || 'zh-CN';
  });
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('issuer-color-scheme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const t = useCallback((key: string) => getTranslation(locale, key), [locale]);

  const menuRef = useRef<HTMLDivElement>(null);

  // 拖拽状态
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('floating-ball-position');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { x: null, y: null };
      }
    }
    return { x: null, y: null };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const ballStartRef = useRef<{ x: number; y: number } | null>(null);
  const ballRef = useRef<HTMLDivElement | null>(null);
  const hasShownWarningRef = useRef(false);

  const cleanupBall = useCallback(() => {
    const ball = document.getElementById('excellence-floating-ball');
    if (ball) ball.remove();
  }, []);

  const checkUsage = useCallback(() => {
    if (!isIssuePage()) {
      setUsageWarning(false);
      hasShownWarningRef.current = false;
      return;
    }

    const usage = getUsageFromPage();
    if (usage && (usage.aiUsage === '' || usage.aiUsage === '0')) {
      setUsageWarning(true);
      // 只显示一次 Toast 提醒
      if (!hasShownWarningRef.current) {
        toast.warning(`${t("usage.warning")}\n${t("usage.fillUsage")}`, { duration: 6000 });
        hasShownWarningRef.current = true;
      }
    } else {
      setUsageWarning(false);
      hasShownWarningRef.current = false;
    }
  }, [t]);

  const handleMenuSelect = (value: string) => {
    setShowMenu(false);
    
    if (value === "issue") {
      setShowIssueReport(true);
    } else if (value === "weekly") {
      setShowWeeklyReport(true);
    } else if (value === "settings") {
      setShowSettings(true);
    } else if (value === "theme") {
      const newScheme = isDark ? 'light' : 'dark';
      setIsDark(!isDark);
      localStorage.setItem('issuer-color-scheme', newScheme);
      if (newScheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showMenu]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isCmdOrCtrl = event.metaKey || event.ctrlKey;
      
      // Ctrl/Cmd + Shift + I: 打开 Issue Report
      if (isCmdOrCtrl && event.shiftKey && event.key === 'I') {
        event.preventDefault();
        setShowMenu(false);
        setShowIssueReport(true);
      }
      
      // Ctrl/Cmd + Shift + W: 打开 Weekly Report
      if (isCmdOrCtrl && event.shiftKey && event.key === 'W') {
        event.preventDefault();
        setShowMenu(false);
        setShowWeeklyReport(true);
      }
      
      // Esc: 关闭弹窗或菜单
      if (event.key === 'Escape') {
        // 关闭优先级：弹窗 > 菜单
        if (showIssueReport) {
          setShowIssueReport(false);
        } else if (showWeeklyReport) {
          setShowWeeklyReport(false);
        } else if (showMenu) {
          setShowMenu(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showIssueReport, showWeeklyReport, showMenu]);

  useEffect(() => {
    if (!isRedmineSite()) {
      cleanupBall();
      return;
    }

    checkUsage();
    cleanupBall();

    const ball = document.createElement('div');
    ball.id = 'excellence-floating-ball';
    ball.className = 'floating-ball';
    
    // 使用图片图标
    const icon = document.createElement('img');
    const iconPath = isDark ? 'dark.svg' : 'light.svg';
    
    // 在扩展环境中使用 chrome.runtime.getURL，否则使用相对路径
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      icon.src = chrome.runtime.getURL(iconPath);
    } else {
      icon.src = iconPath;
    }
    
    icon.style.width = '32px';
    icon.style.height = '32px';
    icon.style.pointerEvents = 'none';
    ball.appendChild(icon);
    
    // 如果有使用警告，添加警告标记
    if (usageWarning) {
      const warningBadge = document.createElement('div');
      warningBadge.textContent = '⚠️';
      warningBadge.style.position = 'absolute';
      warningBadge.style.top = '-5px';
      warningBadge.style.right = '-5px';
      warningBadge.style.fontSize = '16px';
      ball.appendChild(warningBadge);
    }
    
    ball.style.backgroundSize = 'cover';
    ball.style.backgroundPosition = 'center';
    ball.style.position = 'fixed';
    ball.style.zIndex = '2147483647';
    ball.style.cursor = 'grab';
    ball.style.width = '50px';
    ball.style.height = '50px';
    ball.style.display = 'flex';
    ball.style.alignItems = 'center';
    ball.style.justifyContent = 'center';
    ball.style.borderRadius = '50%';
    ball.style.background = isDark ? '#1e293b' : 'white';
    ball.style.boxShadow = isDark 
      ? '0 4px 12px rgba(0,0,0,0.4)' 
      : '0 4px 12px rgba(0,0,0,0.15)';
    ball.style.transition = 'transform 0.2s, box-shadow 0.2s';
    ball.style.userSelect = 'none';
    ball.style.touchAction = 'none';
    ball.style.overflow = 'visible';

    // 应用保存的位置或使用默认位置
    if (position.x !== null && position.y !== null) {
      ball.style.left = `${position.x}px`;
      ball.style.top = `${position.y}px`;
    } else {
      ball.style.bottom = '20px';
      ball.style.right = '20px';
    }

    ballRef.current = ball;

    // 拖拽处理函数
    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      setIsDragging(true);
      setHasDragged(false);
      ball.style.cursor = 'grabbing';
      ball.style.transition = 'none';
      
      const rect = ball.getBoundingClientRect();
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      ballStartRef.current = { x: rect.left, y: rect.top };
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      
      const touch = e.touches[0];
      setIsDragging(true);
      setHasDragged(false);
      ball.style.transition = 'none';
      
      const rect = ball.getBoundingClientRect();
      dragStartRef.current = { x: touch.clientX, y: touch.clientY };
      ballStartRef.current = { x: rect.left, y: rect.top };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragStartRef.current || !ballStartRef.current) return;
      
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      
      // 如果移动超过 5px，认为是拖拽而不是点击
      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        setHasDragged(true);
      }
      
      let newX = ballStartRef.current.x + deltaX;
      let newY = ballStartRef.current.y + deltaY;
      
      // 边界限制
      const maxX = window.innerWidth - 50;
      const maxY = window.innerHeight - 50;
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));
      
      ball.style.left = `${newX}px`;
      ball.style.top = `${newY}px`;
      ball.style.bottom = 'auto';
      ball.style.right = 'auto';
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || !dragStartRef.current || !ballStartRef.current) return;
      
      const touch = e.touches[0];
      const deltaX = touch.clientX - dragStartRef.current.x;
      const deltaY = touch.clientY - dragStartRef.current.y;
      
      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        setHasDragged(true);
      }
      
      let newX = ballStartRef.current.x + deltaX;
      let newY = ballStartRef.current.y + deltaY;
      
      const maxX = window.innerWidth - 50;
      const maxY = window.innerHeight - 50;
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));
      
      ball.style.left = `${newX}px`;
      ball.style.top = `${newY}px`;
      ball.style.bottom = 'auto';
      ball.style.right = 'auto';
    };

    const handleMouseUp = () => {
      if (!isDragging) return;
      
      setIsDragging(false);
      ball.style.cursor = 'grab';
      ball.style.transition = 'transform 0.2s, box-shadow 0.2s';
      
      // 保存位置
      const rect = ball.getBoundingClientRect();
      const newPos = { x: rect.left, y: rect.top };
      setPosition(newPos);
      localStorage.setItem('floating-ball-position', JSON.stringify(newPos));
      
      // 如果没有拖拽（只是点击），则切换菜单
      if (!hasDragged) {
        const rect = ball.getBoundingClientRect();
        setMenuPosition({ top: rect.top, left: rect.left + rect.width / 2 });
        setShowMenu(prev => !prev);
      }
      
      dragStartRef.current = null;
      ballStartRef.current = null;
    };

    const handleTouchEnd = () => {
      if (!isDragging) return;
      
      setIsDragging(false);
      ball.style.transition = 'transform 0.2s, box-shadow 0.2s';
      
      const rect = ball.getBoundingClientRect();
      const newPos = { x: rect.left, y: rect.top };
      setPosition(newPos);
      localStorage.setItem('floating-ball-position', JSON.stringify(newPos));
      
      if (!hasDragged) {
        setMenuPosition({ top: rect.top, left: rect.left + rect.width / 2 });
        setShowMenu(prev => !prev);
      }
      
      dragStartRef.current = null;
      ballStartRef.current = null;
    };

    // 悬停效果
    ball.onmouseenter = () => {
      if (!isDragging) {
        ball.style.transform = 'scale(1.1)';
        ball.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)';
      }
    };

    ball.onmouseleave = () => {
      if (!isDragging) {
        ball.style.transform = 'scale(1)';
        ball.style.boxShadow = isDark
          ? '0 4px 12px rgba(0,0,0,0.4)'
          : '0 4px 12px rgba(0,0,0,0.15)';
      }
    };

    // 绑定事件
    ball.addEventListener('mousedown', handleMouseDown);
    ball.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleTouchEnd);

    document.body.appendChild(ball);

    const interval = setInterval(checkUsage, 2000);

    return () => {
      clearInterval(interval);
      ball.removeEventListener('mousedown', handleMouseDown);
      ball.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleTouchEnd);
      cleanupBall();
    };
  }, [cleanupBall, checkUsage, usageWarning, isDark, isDragging, hasDragged, position]);

  if (!isRedmineSite()) return null;

  return (
    <>
      {/* 弹出式菜单 */}
      <div
        ref={menuRef}
        style={{
          position: 'fixed',
          bottom: 'auto',
          right: 'auto',
          top: menuPosition ? `${menuPosition.top - 8}px` : '80px',
          left: menuPosition ? `${menuPosition.left}px` : 'auto',
          transform: 'translateX(-50%) translateY(-100%)',
          zIndex: 2147483646,
          opacity: showMenu ? 1 : 0,
          pointerEvents: showMenu ? 'auto' : 'none',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          marginTop: showMenu ? '0' : '10px',
        }}
      >
        <div
          style={{
            minWidth: '200px',
            background: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
            borderRadius: '16px',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
            boxShadow: isDark
              ? '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)'
              : '0 20px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.02)',
            padding: '8px',
            overflow: 'hidden',
          }}
        >
          {/* 菜单头部 */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'}`,
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: isDark ? '#94a3b8' : '#64748b',
                letterSpacing: '0.3px',
              }}
            >
              {usageWarning ? `⚠️ ${t("usage.fillUsageOnPage")}` : t("menu.selectFunction")}
            </span>
            <button
              onClick={() => setShowMenu(false)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isDark ? '#94a3b8' : '#94a3b8',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                e.currentTarget.style.color = isDark ? '#e2e8f0' : '#475569';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = isDark ? '#94a3b8' : '#94a3b8';
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* 菜单项 */}
          <button
            onClick={() => handleMenuSelect('issue')}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: 'none',
              borderRadius: '12px',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'all 0.15s ease',
              color: isDark ? '#e2e8f0' : '#1e293b',
              fontSize: '14px',
              fontWeight: 500,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(59, 130, 246, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              >
              <FileText size={16} style={{ color: '#3b82f6' }} />
            </div>
            <span>{t("menu.issueReport")}</span>
          </button>

          <button
            onClick={() => handleMenuSelect('weekly')}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: 'none',
              borderRadius: '12px',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'all 0.15s ease',
              color: isDark ? '#e2e8f0' : '#1e293b',
              fontSize: '14px',
              fontWeight: 500,
              marginTop: '4px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(34, 197, 94, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BarChart3 size={16} style={{ color: '#22c55e' }} />
            </div>
            <span>{t("menu.weeklyReport")}</span>
          </button>

          <div
            style={{
              height: '1px',
              background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
              margin: '8px 12px',
            }}
          />

          <button
            onClick={() => handleMenuSelect('settings')}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: 'none',
              borderRadius: '12px',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'all 0.15s ease',
              color: isDark ? '#e2e8f0' : '#1e293b',
              fontSize: '14px',
              fontWeight: 500,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(168, 85, 247, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: isDark ? 'rgba(168, 85, 247, 0.2)' : 'rgba(168, 85, 247, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Settings size={16} style={{ color: '#a855f7' }} />
            </div>
            <span>{t("menu.settings")}</span>
          </button>

            <div
              style={{
                height: '1px',
                background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                margin: '8px 12px',
              }}
            />

            <button
              onClick={() => handleMenuSelect('theme')}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                borderRadius: '12px',
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.15s ease',
                color: isDark ? '#e2e8f0' : '#1e293b',
                fontSize: '14px',
                fontWeight: 500,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(99, 102, 241, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: isDark ? 'rgba(251, 191, 36, 0.2)' : 'rgba(99, 102, 241, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isDark ? (
                  <Sun size={16} style={{ color: '#fbbf24' }} />
                ) : (
                  <Moon size={16} style={{ color: '#6366f1' }} />
                )}
              </div>
              <span>{isDark ? t("theme.switchToLight") : t("theme.switchToDark")}</span>
            </button>
          </div>
        </div>

      <IssueReportModal
        opened={showIssueReport}
        onClose={() => setShowIssueReport(false)}
        locale={locale}
      />
      <WeeklyReportModal
        opened={showWeeklyReport}
        onClose={() => setShowWeeklyReport(false)}
        locale={locale}
      />
      <SettingsModal
        opened={showSettings}
        onClose={() => setShowSettings(false)}
        theme={isDark ? 'dark' : 'light'}
        locale={locale}
        onThemeChange={(theme) => {
          const isDarkTheme = theme === 'dark';
          setIsDark(isDarkTheme);
          localStorage.setItem('issuer-color-scheme', isDarkTheme ? 'dark' : 'light');
          if (isDarkTheme) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }}
        onLocaleChange={(newLocale) => {
          setLocale(newLocale);
          localStorage.setItem('issuer-locale', newLocale);
        }}
      />
      
      
      <Toaster theme={isDark ? 'dark' : 'light'} />
    </>
  );
};

function App() {
  return <FloatingBall />;
}

export default App;
