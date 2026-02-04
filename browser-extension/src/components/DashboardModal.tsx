import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, Calendar, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { showToast } from '../App';

interface Issue {
  id: string;
  project_id: string;
  tracker: string;
  subject: string;
  status: string;
  priority: string;
  estimated_hours?: number;
  closed_on?: string;
  due_date?: string;
}

interface DashboardStats {
  totalIssues: number;
  totalHours: number;
  thisWeekIssues: number;
  thisWeekHours: number;
  thisMonthIssues: number;
  thisMonthHours: number;
  byProject: Record<string, { count: number; hours: number }>;
  byTracker: Record<string, { count: number; hours: number }>;
  weeklyTrend: { week: string; count: number; hours: number }[];
}

interface DashboardModalProps {
  opened: boolean;
  onClose: () => void;
}

// 获取本周和本月的日期范围
const getDateRanges = () => {
  const now = new Date();
  
  // 本周（周一到周日）
  const weekStart = new Date(now);
  const dayOfWeek = weekStart.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  weekStart.setDate(weekStart.getDate() + diffToMonday);
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  // 本月
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  monthEnd.setHours(23, 59, 59, 999);
  
  // 最近8周趋势数据
  const weeklyTrend = [];
  for (let i = 7; i >= 0; i--) {
    const weekDate = new Date(weekStart);
    weekDate.setDate(weekDate.getDate() - i * 7);
    const weekEndDate = new Date(weekDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    weeklyTrend.push({
      week: `${weekDate.getMonth() + 1}/${weekDate.getDate()}`,
      startDate: weekDate.toISOString().split('T')[0],
      endDate: weekEndDate.toISOString().split('T')[0],
      count: 0,
      hours: 0,
    });
  }
  
  return {
    weekStart: weekStart.toISOString().split('T')[0],
    weekEnd: weekEnd.toISOString().split('T')[0],
    monthStart: monthStart.toISOString().split('T')[0],
    monthEnd: monthEnd.toISOString().split('T')[0],
    weeklyTrend,
  };
};

// 计算统计数据
const calculateStats = (issues: Issue[], dateRanges: ReturnType<typeof getDateRanges>): DashboardStats => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const stats: DashboardStats = {
    totalIssues: issues.length,
    totalHours: 0,
    thisWeekIssues: 0,
    thisWeekHours: 0,
    thisMonthIssues: 0,
    thisMonthHours: 0,
    byProject: {},
    byTracker: {},
    weeklyTrend: dateRanges.weeklyTrend,
  };
  
  issues.forEach((issue) => {
    const hours = issue.estimated_hours || 0;
    const closedDate = issue.closed_on ? new Date(issue.closed_on) : null;
    
    stats.totalHours += hours;
    
    // 按项目统计
    if (!stats.byProject[issue.project_id]) {
      stats.byProject[issue.project_id] = { count: 0, hours: 0 };
    }
    stats.byProject[issue.project_id].count += 1;
    stats.byProject[issue.project_id].hours += hours;
    
    // 按类型统计
    if (!stats.byTracker[issue.tracker]) {
      stats.byTracker[issue.tracker] = { count: 0, hours: 0 };
    }
    stats.byTracker[issue.tracker].count += 1;
    stats.byTracker[issue.tracker].hours += hours;
    
    // 本周统计
    if (closedDate && closedDate >= new Date(dateRanges.weekStart) && closedDate <= new Date(dateRanges.weekEnd)) {
      stats.thisWeekIssues += 1;
      stats.thisWeekHours += hours;
    }
    
    // 本月统计
    if (closedDate && closedDate.getMonth() === currentMonth && closedDate.getFullYear() === currentYear) {
      stats.thisMonthIssues += 1;
      stats.thisMonthHours += hours;
    }
  });
  
  return stats;
};

// 简单的条形图组件
const SimpleBarChart = ({ 
  data, 
  maxValue, 
  color = 'bg-blue-500',
  showValue = true,
}: { 
  data: { label: string; value: number; hours?: number }[];
  maxValue: number;
  color?: string;
  showValue?: boolean;
}) => {
  return (
    <div className="space-y-2">
      {data.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-16 truncate" title={item.label}>
            {item.label}
          </span>
          <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden relative">
            <div
              className={`h-full ${color} rounded-full transition-all duration-500`}
              style={{ width: `${Math.max((item.value / maxValue) * 100, 2)}%` }}
            />
            {showValue && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium">
                {item.value}
              </span>
            )}
          </div>
          {item.hours !== undefined && (
            <span className="text-xs text-muted-foreground w-14 text-right">
              {item.hours}h
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

// 统计卡片组件
const StatCard = ({ 
  title, 
  value, 
  subValue, 
  icon: Icon, 
  color = 'text-blue-500',
  bgColor = 'bg-blue-50 dark:bg-blue-950/30',
}: { 
  title: string;
  value: string | number;
  subValue?: string;
  icon: React.ElementType;
  color?: string;
  bgColor?: string;
}) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subValue && <p className="text-xs text-muted-foreground mt-1">{subValue}</p>}
        </div>
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

export function DashboardModal({ opened, onClose }: DashboardModalProps) {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [projectNames, setProjectNames] = useState<Record<string, string>>({});

  const dateRanges = useMemo(() => getDateRanges(), []);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      
      // 获取本月数据（扩大范围以获取统计数据）
      const { monthStart, monthEnd } = getDateRanges();
      
      // 获取所有项目
      const projectsResponse = await fetch(`${apiBaseUrl}/api/redmine/projects`);
      const projectsData = await projectsResponse.json();
      
      const projectNameMap: Record<string, string> = {};
      if (projectsData.success) {
        projectsData.data.forEach((p: { id: string; name: string }) => {
          projectNameMap[p.id] = p.name;
        });
        setProjectNames(projectNameMap);
      }

      // 获取所有已关闭的 Issue（最近3个月的数据）
      const allIssues: Issue[] = [];
      const favoriteProjects = ['65', '114']; // 默认只查询常用项目，避免请求过多
      
      for (const projectId of favoriteProjects) {
        try {
          const response = await fetch(
            `${apiBaseUrl}/api/redmine/weekly-issues?projectId=${projectId}&startDate=${monthStart}&endDate=${monthEnd}&userId=654`
          );
          const data = await response.json();
          if (data.success && data.data) {
            // 只统计已关闭的 Issue
            const closedIssues = data.data.filter((issue: Issue) => 
              issue.status?.toLowerCase().includes('closed') ||
              issue.status?.toLowerCase().includes('resolved')
            );
            allIssues.push(...closedIssues);
          }
        } catch (err) {
          console.error(`Failed to fetch project ${projectId}:`, err);
        }
      }

      const calculatedStats = calculateStats(allIssues, dateRanges);
      setStats(calculatedStats);
      
      if (allIssues.length === 0) {
        showToast('info', '暂无数据', '本月没有找到已完成的 Issue');
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      const errorMsg = err instanceof Error ? err.message : '获取统计数据失败';
      setError(errorMsg);
      showToast('error', '加载失败', errorMsg);
    } finally {
      setLoading(false);
    }
  }, [dateRanges]);

  useEffect(() => {
    if (opened) {
      fetchDashboardData();
    }
  }, [opened, fetchDashboardData]);

  // 准备图表数据
  const projectChartData = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats.byProject)
      .map(([projectId, data]) => ({
        label: projectNames[projectId] || `Project ${projectId}`,
        value: data.count,
        hours: Math.round(data.hours * 10) / 10,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [stats, projectNames]);

  const trackerChartData = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats.byTracker)
      .map(([tracker, data]) => ({
        label: tracker,
        value: data.count,
        hours: Math.round(data.hours * 10) / 10,
      }))
      .sort((a, b) => b.value - a.value);
  }, [stats]);

  const maxProjectValue = Math.max(...projectChartData.map(d => d.value), 1);
  const maxTrackerValue = Math.max(...trackerChartData.map(d => d.value), 1);

  return (
    <Dialog open={opened} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            工作统计仪表盘
          </DialogTitle>
          <DialogDescription>
            查看本月/本周 Issue 完成情况和工时统计
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
            <Skeleton className="h-48" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500">{error}</p>
            <Button variant="outline" className="mt-4" onClick={fetchDashboardData}>
              重试
            </Button>
          </div>
        ) : stats ? (
          <div className="space-y-6 overflow-y-auto max-h-[calc(85vh-120px)] pr-2">
            {/* 核心统计卡片 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="本月完成"
                value={stats.thisMonthIssues}
                subValue={`${Math.round(stats.thisMonthHours * 10) / 10} 工时`}
                icon={Calendar}
                color="text-blue-500"
                bgColor="bg-blue-50 dark:bg-blue-950/30"
              />
              <StatCard
                title="本周完成"
                value={stats.thisWeekIssues}
                subValue={`${Math.round(stats.thisWeekHours * 10) / 10} 工时`}
                icon={CheckCircle}
                color="text-green-500"
                bgColor="bg-green-50 dark:bg-green-950/30"
              />
              <StatCard
                title="总工时"
                value={`${Math.round(stats.totalHours * 10) / 10}h`}
                subValue={`${stats.totalIssues} 个 Issue`}
                icon={Clock}
                color="text-amber-500"
                bgColor="bg-amber-50 dark:bg-amber-950/30"
              />
              <StatCard
                title="平均工时/Issue"
                value={stats.totalIssues > 0 
                  ? `${Math.round((stats.totalHours / stats.totalIssues) * 10) / 10}h` 
                  : '0h'}
                icon={TrendingUp}
                color="text-purple-500"
                bgColor="bg-purple-50 dark:bg-purple-950/30"
              />
            </div>

            {/* 按项目统计 */}
            {projectChartData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">按项目分布（Top 5）</CardTitle>
                </CardHeader>
                <CardContent>
                  <SimpleBarChart 
                    data={projectChartData} 
                    maxValue={maxProjectValue}
                    color="bg-blue-500"
                  />
                </CardContent>
              </Card>
            )}

            {/* 按类型统计 */}
            {trackerChartData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">按类型分布</CardTitle>
                </CardHeader>
                <CardContent>
                  <SimpleBarChart 
                    data={trackerChartData} 
                    maxValue={maxTrackerValue}
                    color="bg-emerald-500"
                  />
                </CardContent>
              </Card>
            )}

            {/* 数据更新时间 */}
            <p className="text-xs text-muted-foreground text-center">
              数据更新时间：{new Date().toLocaleString('zh-CN')}
            </p>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
