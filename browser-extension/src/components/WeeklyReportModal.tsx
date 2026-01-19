import { Alert, Button, Group, LoadingOverlay, Modal, Stack, TextInput, Textarea, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { utils, write } from 'xlsx-js-style';

interface WeeklyReportModalProps {
  opened: boolean;
  onClose: () => void;
}

export const WeeklyReportModal = ({ opened, onClose }: WeeklyReportModalProps) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState('');
  const [weekNumber, setWeekNumber] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [summary, setSummary] = useState('');

  useEffect(() => {
    if (opened) {
      setSuccess(false);
      setError(null);
    }
  }, [opened]);

  const handleGenerate = () => {
    if (!project.trim()) {
      setError('请输入项目名称');
      return;
    }
    if (!weekNumber.trim()) {
      setError('请输入周数');
      return;
    }
    if (!year.trim()) {
      setError('请输入年份');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const workbook = utils.book_new();
      const worksheet = utils.aoa_to_sheet([
        [`${year}年第${weekNumber}周周报`],
        [`项目: ${project}`],
        [''],
        ['本周工作总结', summary || '无'],
        [''],
        [`生成时间: ${new Date().toLocaleString('zh-CN')}`],
      ]);

      worksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
      worksheet['!cols'] = [{ wch: 20 }, { wch: 60 }];

      const titleCell = worksheet['A1'];
      if (titleCell) {
        titleCell.s = { font: { bold: true, sz: 16 }, alignment: { horizontal: 'center' } };
      }

      const labelCell = worksheet['A4'];
      if (labelCell) {
        labelCell.s = { font: { bold: true } };
      }

      utils.book_append_sheet(workbook, worksheet, 'Weekly');

      const buffer = write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${project}_${year}W${weekNumber}.xlsx`;
      link.click();
      URL.revokeObjectURL(link.href);

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成报告失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={<Title order={4}>周报</Title>} size="md">
      <LoadingOverlay visible={loading} />

      {error && <Alert color="red" mb="md" onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert color="green" mb="md" onClose={() => setSuccess(false)}>周报已生成</Alert>}

      <Stack gap="md">
        <Group grow>
          <TextInput label="项目" placeholder="项目名称" value={project} onChange={(e) => setProject(e.target.value)} disabled={loading} />
          <TextInput label="年份" placeholder="2024" value={year} onChange={(e) => setYear(e.target.value)} disabled={loading} />
        </Group>

        <TextInput label="周数" placeholder="1-52" value={weekNumber} onChange={(e) => setWeekNumber(e.target.value)} disabled={loading} />

        <Textarea label="本周工作总结" placeholder="请输入本周工作总结..." minRows={4} value={summary} onChange={(e) => setSummary(e.target.value)} disabled={loading} />

        <Group justify="flex-end">
          <Button variant="subtle" color="dark" onClick={onClose} disabled={loading}>取消</Button>
          <Button color="dark" onClick={handleGenerate} disabled={!project.trim() || !weekNumber.trim() || !year.trim() || loading}>生成</Button>
        </Group>
      </Stack>
    </Modal>
  );
};
