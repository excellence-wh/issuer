import { useEffect, useState } from 'react';
import { utils, write } from 'xlsx-js-style';
import { formatDateForInput, getPeriodForDate } from '../utils/date';
import { showToast } from '../App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ChevronsUpDown } from 'lucide-react';
import { type Locale, getTranslation } from '@/lib/i18n';

const FAVORITE_PROJECTS = ['65', '114'];

interface WeeklyReportModalProps {
  opened: boolean;
  onClose: () => void;
  locale: Locale;
}

interface Period {
  startDate: string;
  endDate: string;
  label: string;
}

interface Project {
  id: string;
  name: string;
}

interface Issue {
  id: number;
  subject: string;
  tracker: string;
  priority: string;
  estimated_hours: number;
  assigned_to: string;
  start_date: string;
  due_date: string;
  created_on: string;
  resolved_date: string;
  project_id: string;
}

export const WeeklyReportModal = ({ opened, onClose, locale }: WeeklyReportModalProps) => {
  const t = (key: string) => getTranslation(locale, key);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>(FAVORITE_PROJECTS);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState(0);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isCustomPeriod, setIsCustomPeriod] = useState(false);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [openProjects, setOpenProjects] = useState(false);

  useEffect(() => {
    if (opened) {
      setSuccess(false);
      setError(null);
      setIssues([]);
      fetchProjects();
      generatePeriods();
    }
  }, [opened]);

  const fetchProjects = async () => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
    try {
      const response = await fetch(`${apiBaseUrl}/api/redmine/projects`);
      const data = await response.json();
      if (data.success) {
        setProjects(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      const errorMsg = t('weekly.projectListFailed');
      setError(errorMsg);
      showToast('error', t('toast.networkError'), errorMsg);
    }
  };

  const generatePeriods = () => {
    const periodList: Period[] = [];
    const today = new Date();

    for (let i = 0; i < 12; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() - (i * 7));
      const period = getPeriodForDate(targetDate);
      periodList.push({
        startDate: formatDateForInput(period.startDate),
        endDate: formatDateForInput(period.endDate),
        label: period.periodLabel
      });
    }

    setPeriods(periodList);
    setSelectedPeriodIndex(0);
    setCustomStartDate(periodList[0].startDate);
    setCustomEndDate(periodList[0].endDate);
    setIsCustomPeriod(false);
  };

  const handlePeriodChange = (value: string) => {
    if (value === 'custom') {
      setIsCustomPeriod(true);
    } else {
      const index = parseInt(value);
      setIsCustomPeriod(false);
      setSelectedPeriodIndex(index);
      setCustomStartDate(periods[index].startDate);
      setCustomEndDate(periods[index].endDate);
    }
  };

  const getSelectedPeriod = (): { startDate: string; endDate: string } => {
    if (isCustomPeriod) {
      return { startDate: customStartDate, endDate: customEndDate };
    }
    return { startDate: periods[selectedPeriodIndex].startDate, endDate: periods[selectedPeriodIndex].endDate };
  };

  const toggleProject = (projectId: string) => {
    setSelectedProjects(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleGenerate = async () => {
    if (!selectedProjects || selectedProjects.length === 0) {
      setError(t('weekly.selectProject'));
      return;
    }

    const { startDate, endDate } = getSelectedPeriod();
    if (!startDate || !endDate) {
      setError(t('weekly.selectPeriod'));
      return;
    }

    if (startDate > endDate) {
      setError(t('weekly.dateRangeError'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

      const allIssues: Issue[] = [];

      for (const projectId of selectedProjects) {
        const response = await fetch(
          `${apiBaseUrl}/api/redmine/weekly-issues?projectId=${projectId}&startDate=${startDate}&endDate=${endDate}&userId=654`
        );
        const data = await response.json();
        if (data.success) {
          allIssues.push(...data.data);
        }
      }

      setIssues(allIssues);

      if (allIssues.length === 0) {
        setError(t('weekly.noIssuesFound'));
        setLoading(false);
        return;
      }

      const formattedStartDate = startDate.replace(/-/g, '/');
      const formattedEndDate = endDate.replace(/-/g, '/');

      const workbook = utils.book_new();
      const worksheet = generateSheet(allIssues, formattedStartDate, formattedEndDate);
      utils.book_append_sheet(workbook, worksheet, 'Weekly');

      const buffer = write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Weekly_Report_${formattedStartDate}_${formattedEndDate}.xlsx`;
      link.click();
      URL.revokeObjectURL(link.href);

      setSuccess(true);
      showToast('success', t('toast.weeklyReportGenerated'), t('weekly.projectsGenerated').replace('{count}', String(selectedProjects.length)));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t('toast.reportGenerateError');
      setError(errorMsg);
      showToast('error', t('toast.reportGenerateError'), errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const generateSheet = (allProjectIssues: Issue[], formattedStartDate: string, formattedEndDate: string) => {
    const headers = [
      'Redmine No.', 'Project', 'Tracker', 'Description', 'Priority',
      t('weekly.totalEstimatedHours'), t('weekly.estimatedHours'), t('weekly.weightedHours'),
      'Need Impact Analysis', 'Is Study Issue', 'Seniority', 'Reopened Developer',
      t('weekly.assignee'), t('weekly.dueDate'), t('weekly.startDate'), t('weekly.resolvedDate'), t('weekly.registrationStatus'), t('weekly.date')
    ];

    const rows: any[][] = [headers];

    allProjectIssues.forEach(issue => {
      const projectName = projects.find(p => p.id === issue.project_id)?.name || issue.project_id;
      rows.push([
        issue.id,
        projectName,
        issue.tracker,
        issue.subject,
        issue.priority,
        issue.estimated_hours,
        issue.estimated_hours,
        issue.estimated_hours,
        '', '', '', '',
        '程卓',
        formattedEndDate,
        formattedStartDate,
        formattedEndDate,
        '',
        ''
      ]);
    });

    const workbook = utils.book_new();
    const worksheet = utils.aoa_to_sheet(rows);

    const colWidths = [
      { wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 100 }, { wch: 12 },
      { wch: 12 }, { wch: 12 }, { wch: 12 },
      { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 15 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 }
    ];
    worksheet['!cols'] = colWidths;
    worksheet['!rows'] = [{ hpt: 25 }, ...(worksheet['!rows'] || []).slice(1)];

    const range = utils.decode_range(worksheet['!ref']!);
    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const addr = utils.encode_cell({ r: R, c: C });
        if (!worksheet[addr]) {
          worksheet[addr] = { v: '', t: 's' };
        }
        const cell = worksheet[addr];
        cell.s = {
          font: R === 0 ? { bold: true } : {},
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      }
    }

    utils.book_append_sheet(workbook, worksheet, 'Weekly');
    return worksheet;
  };

  const handleClose = () => {
    setError(null);
    setSuccess(false);
    onClose();
  };

  const selectedProjectsLabel = selectedProjects.length > 0
    ? selectedProjects.length === 1
      ? projects.find(p => p.id === selectedProjects[0])?.name || `${selectedProjects.length} ${t('weekly.selectProject')}`
      : `${selectedProjects.length} ${t('weekly.selectProject')}`
    : t('weekly.selectProject');

  return (
      <Dialog open={opened} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('menu.weeklyReport')}</DialogTitle>
          <DialogDescription>
            {t('menu.weeklyReport')}
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-50">
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription className="flex justify-between items-center">
              {error}
              <Button variant="ghost" size="sm" onClick={() => setError(null)}>
                {t('common.close')}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-100 border-green-200">
            <AlertDescription className="flex justify-between items-center">
              报告已生成
              <Button variant="ghost" size="sm" onClick={() => setSuccess(false)}>
                {t('common.close')}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 mt-4 overflow-y-auto max-h-[calc(85vh-180px)] pr-2">
          <div className="space-y-2">
            <Label>{t('weekly.selectProject')}</Label>
            <Popover open={openProjects} onOpenChange={setOpenProjects}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openProjects}
                  className="w-full justify-between"
                  disabled={loading || projects.length === 0}
                >
                  {selectedProjectsLabel}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <div className="max-h-60 overflow-auto p-2">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center space-x-2 py-2 px-2 hover:bg-accent rounded cursor-pointer"
                      onClick={() => toggleProject(project.id)}
                    >
                      <Checkbox
                        checked={selectedProjects.includes(project.id)}
                        onCheckedChange={() => toggleProject(project.id)}
                      />
                      <span className="text-sm">{project.name}</span>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>{t('weekly.selectPeriod')}</Label>
            <div className="flex gap-2">
              <Select
                value={isCustomPeriod ? 'custom' : String(selectedPeriodIndex)}
                onValueChange={handlePeriodChange}
                disabled={loading}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={t('weekly.selectPeriod')} />
                </SelectTrigger>
                <SelectContent>
                  {periods.map((p, i) => (
                    <SelectItem key={i} value={String(i)}>{p.label}</SelectItem>
                  ))}
                  <SelectItem value="custom">{t('weekly.custom')}</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant={isCustomPeriod ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsCustomPeriod(!isCustomPeriod)}
                disabled={loading}
              >
                {isCustomPeriod ? t('weekly.cancelCustom') : t('weekly.custom')}
              </Button>
            </div>
          </div>

          {isCustomPeriod && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('weekly.startDate')}</Label>
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('weekly.dueDate')}</Label>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {issues.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm font-medium mb-3">问题列表 ({issues.length})</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">No.</TableHead>
                      <TableHead className="whitespace-nowrap hidden sm:table-cell">Tracker</TableHead>
                      <TableHead className="w-[200px]">Subject</TableHead>
                      <TableHead className="whitespace-nowrap hidden md:table-cell">Resolved Date</TableHead>
                    </TableRow>
                  </TableHeader>
              <TableBody>
                {issues.slice(0, 10).map(issue => (
                  <TableRow key={issue.id}>
                    <TableCell className="whitespace-nowrap">{issue.id}</TableCell>
                    <TableCell className="whitespace-nowrap hidden sm:table-cell">{issue.tracker}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{issue.subject}</TableCell>
                    <TableCell className="whitespace-nowrap hidden md:table-cell">{issue.resolved_date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
                </Table>
                {issues.length > 10 && (
                  <p className="text-xs text-gray-500 mt-2">... 共 {issues.length} 条</p>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              onClick={handleGenerate}
              disabled={!selectedProjects || selectedProjects.length === 0 || loading}
            >
              {loading ? t('common.generating') : t('common.generate')}
            </Button>
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
