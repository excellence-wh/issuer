import { Badge, Button, Paper, Stack } from '@mantine/core';
import '@mantine/core/styles.css';
import { useCallback, useEffect, useState } from 'react';
import './App.css';
import { IssueReportModal } from './components/IssueReportModal';
import { WeeklyReportModal } from './components/WeeklyReportModal';

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
    ball.style.background = 'white';
    ball.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    ball.style.transition = 'transform 0.2s, box-shadow 0.2s';

    ball.onmouseenter = () => {
      ball.style.transform = 'scale(1.1)';
      ball.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)';
    };

    ball.onmouseleave = () => {
      ball.style.transform = 'scale(1)';
      ball.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    };

    ball.onclick = () => {
      setShowMenu(prev => !prev);
    };

    document.body.appendChild(ball);

    const interval = setInterval(checkUsage, 2000);

    return () => {
      clearInterval(interval);
      cleanupBall();
    };
  }, [cleanupBall, checkUsage, usageWarning]);

  if (!isRedmineSite()) return null;

  return (
    <>
      <div className="floating-menu-container">
        {showMenu && (
          <div 
            className="floating-menu" 
            style={{ 
              position: 'fixed', 
              bottom: '80px',
              right: '20px',
              zIndex: '2147483646' 
            }}
          >
            <Paper shadow="md" p="md" withBorder>
              <Stack gap="xs">
                {usageWarning && (
                  <Badge color="yellow" size="sm" mb="xs">
                    请填写AI Usage
                  </Badge>
                )}
                <Button variant="subtle" color="dark" onClick={() => { setShowMenu(false); setShowIssueReport(true); }}>
                  Issue Report
                </Button>
                <Button variant="subtle" color="dark" onClick={() => { setShowMenu(false); setShowWeeklyReport(true); }}>
                  Weekly Report
                </Button>
              </Stack>
            </Paper>
          </div>
        )}
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
