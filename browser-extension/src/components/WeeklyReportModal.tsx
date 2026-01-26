import { Alert, Button, Group, LoadingOverlay, Modal, MultiSelect, Stack, TextInput, Title, Text, Select, Paper, Table } from '@mantine/core';
import { useEffect, useState } from 'react';
import { utils, write } from 'xlsx-js-style';
import { formatDateForInput, getPeriodForDate } from '../utils/date';

const FAVORITE_PROJECTS = ['65', '114'];

interface WeeklyReportModalProps {
  opened: boolean;
  onClose: () => void;
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

export const WeeklyReportModal = ({ opened, onClose }: WeeklyReportModalProps) => {
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
      setError('获取项目列表失败，请检查后端服务是否启动');
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

  const handlePeriodChange = (value: string | null) => {
    if (value === null) {
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

  const handleGenerate = async () => {
    if (!selectedProjects || selectedProjects.length === 0) {
      setError('请选择项目');
      return;
    }

    const { startDate, endDate } = getSelectedPeriod();
    if (!startDate || !endDate) {
      setError('请选择周期');
      return;
    }

    if (startDate > endDate) {
      setError('开始日期不能大于结束日期');
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
        setError('未找到符合条件的 issue');
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
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成报告失败');
    } finally {
      setLoading(false);
    }
  };

  const generateSheet = (allProjectIssues: Issue[], formattedStartDate: string, formattedEndDate: string) => {
    const headers = [
      'Redmine No.', 'Project', 'Tracker', 'Description', 'Priority',
      '总预估工时 (Redmine)', '预估工时', '系数工时',
      'Need Impact Analysis', 'Is Study Issue', 'Seniority', 'Reopened Developer',
      'Assignee', 'Due Date', 'Start Date', 'Resolved Date', '登记状态', '日期'
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

  return (
    <Modal opened={opened} onClose={onClose} title={<Title order={4}>Weekly 报告</Title>} size="xl">
      <LoadingOverlay visible={loading} />

      {error && <Alert color="red" mb="md" onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert color="green" mb="md" onClose={() => setSuccess(false)}>报告已生成</Alert>}

      <Stack gap="md">
        <MultiSelect
          label="项目"
          placeholder="选择项目"
          data={projects.map(p => ({ value: p.id, label: p.name }))}
          value={selectedProjects}
          onChange={setSelectedProjects}
          disabled={loading || projects.length === 0}
          searchable
          clearable
          defaultValue={FAVORITE_PROJECTS}
        />

        <div>
          <Text size="sm" fw={500} mb="xs">周期（上周四 ~ 本周三）</Text>
          <Group grow>
            <Select
              data={periods.map((p, i) => ({ value: String(i), label: p.label }))}
              value={isCustomPeriod ? null : String(selectedPeriodIndex)}
              onChange={handlePeriodChange}
              placeholder="选择周期"
              disabled={loading}
              styles={{ input: { cursor: 'pointer' } }}
              clearable={false}
            />
            <Button
              color="dark"
              variant={isCustomPeriod ? 'filled' : 'outline'}
              size="xs"
              onClick={() => setIsCustomPeriod(!isCustomPeriod)}
              disabled={loading}
            >
              {isCustomPeriod ? '取消自定义' : '自定义'}
            </Button>
          </Group>
        </div>

        {isCustomPeriod && (
          <Group grow>
            <TextInput
              type="date"
              label="开始日期"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              disabled={loading}
            />
            <TextInput
              type="date"
              label="结束日期"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              disabled={loading}
            />
          </Group>
        )}

        {issues.length > 0 && (
          <Paper p="sm" withBorder>
            <Text size="sm" fw={500} mb="xs">问题列表 ({issues.length})</Text>
            <Table highlightOnHover striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>No.</Table.Th>
                  <Table.Th>Tracker</Table.Th>
                  <Table.Th>Subject</Table.Th>
                  <Table.Th>Resolved Date</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {issues.slice(0, 10).map(issue => (
                  <Table.Tr key={issue.id}>
                    <Table.Td>{issue.id}</Table.Td>
                    <Table.Td>{issue.tracker}</Table.Td>
                    <Table.Td>{issue.subject}</Table.Td>
                    <Table.Td>{issue.resolved_date}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
            {issues.length > 10 && (
              <Text size="xs" c="gray" mt="xs">... 共 {issues.length} 条</Text>
            )}
          </Paper>
        )}

        <Group justify="flex-end">
          <Button
            color="dark"
            onClick={handleGenerate}
            disabled={!selectedProjects || selectedProjects.length === 0 || loading}
            loading={loading}
          >
            生成
          </Button>
          <Button variant="subtle" color="dark" onClick={onClose} disabled={loading}>取消</Button>
        </Group>
      </Stack>
    </Modal>
  );
};
