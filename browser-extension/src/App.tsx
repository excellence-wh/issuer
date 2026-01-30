import { BarChart3, FileText, Moon, Sun } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import './App.css';
import { IssueReportModal } from './components/IssueReportModal';
import { WeeklyReportModal } from './components/WeeklyReportModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [usageWarning, setUsageWarning] = useState(false);
  const [selectedValue, setSelectedValue] = useState("");
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('issuer-color-scheme') === 'dark';
  });

  const cleanupBall = useCallback(() => {
    const ball = document.getElementById('excellence-floating-ball');
    if (ball) ball.remove();
  }, []);

  const checkUsage = useCallback(() => {
    if (!isIssuePage()) {
      setUsageWarning(false);
      return;
    }

    const usage = getUsageFromPage();
    if (usage && (usage.aiUsage === '' || usage.aiUsage === '0')) {
      setUsageWarning(true);
    } else {
      setUsageWarning(false);
    }
  }, []);

  const handleMenuSelect = (value: string) => {
    setSelectedValue(value);
    setShowMenu(false);
    
    if (value === "issue") {
      setShowIssueReport(true);
    } else if (value === "weekly") {
      setShowWeeklyReport(true);
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
    ball.textContent = usageWarning ? '⚠️' : '📊';
    ball.style.position = 'fixed';
    ball.style.bottom = '20px';
    ball.style.right = '20px';
    ball.style.zIndex = '2147483647';
    ball.style.cursor = 'pointer';
    ball.style.fontSize = '28px';
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

    ball.onmouseenter = () => {
      ball.style.transform = 'scale(1.1)';
      ball.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)';
    };

    ball.onmouseleave = () => {
      ball.style.transform = 'scale(1)';
      ball.style.boxShadow = isDark
        ? '0 4px 12px rgba(0,0,0,0.4)'
        : '0 4px 12px rgba(0,0,0,0.15)';
    };

    ball.onclick = (e) => {
      e.stopPropagation();
      setShowMenu(prev => !prev);
    };

    document.body.appendChild(ball);

    const interval = setInterval(checkUsage, 2000);

    return () => {
      clearInterval(interval);
      cleanupBall();
    };
  }, [cleanupBall, checkUsage, usageWarning, isDark]);

  if (!isRedmineSite()) return null;

  return (
    <>
      {/* shadcn Select 作为下拉菜单 */}
      <div 
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '20px',
          zIndex: 2147483646,
          opacity: showMenu ? 1 : 0,
          pointerEvents: showMenu ? 'auto' : 'none',
          transition: 'opacity 0.2s ease'
        }}
      >
        <Select 
          value={selectedValue} 
          onValueChange={handleMenuSelect}
          open={showMenu}
          onOpenChange={setShowMenu}
        >
          <SelectTrigger 
            style={{ 
              width: '180px',
              background: isDark ? '#1e293b' : 'white',
              borderColor: isDark ? '#334155' : '#e2e8f0',
              color: isDark ? '#e2e8f0' : '#1e293b'
            }}
          >
            <SelectValue placeholder={usageWarning ? "⚠️ 请填写 AI Usage" : "📊 选择功能"} />
          </SelectTrigger>
          <SelectContent 
            style={{ 
              background: isDark ? '#1e293b' : 'white',
              borderColor: isDark ? '#334155' : '#e2e8f0'
            }}
          >
            <SelectItem value="issue">
              <div className="flex items-center gap-2">
                <FileText size={16} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
                <span>Issue Report</span>
              </div>
            </SelectItem>
            <SelectItem value="weekly">
              <div className="flex items-center gap-2">
                <BarChart3 size={16} className={isDark ? 'text-green-400' : 'text-green-600'} />
                <span>Weekly Report</span>
              </div>
            </SelectItem>
            <SelectItem value="theme">
              <div className="flex items-center gap-2">
                {isDark ? (
                  <Sun size={16} className="text-amber-400" />
                ) : (
                  <Moon size={16} className="text-indigo-500" />
                )}
                <span>{isDark ? '浅色模式' : '暗黑模式'}</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <IssueReportModal opened={showIssueReport} onClose={() => setShowIssueReport(false)} />
      <WeeklyReportModal opened={showWeeklyReport} onClose={() => setShowWeeklyReport(false)} />
    </>
  );
};

function App() {
  return <FloatingBall />;
}

export default App;
