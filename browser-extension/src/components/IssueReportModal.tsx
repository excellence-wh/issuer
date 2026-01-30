import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Group,
  LoadingOverlay,
  Modal,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Textarea,
  Title,
  Tooltip,
} from "@mantine/core";
import { IconSparkles } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { llmService } from "../services/llm";
import type { IssueData, ReportFormData } from "../types/issue";
import {
  getHgFilesByIssue,
  getHgFilesDiffByIssue,
  type HgFileChange,
} from "../utils/hg";
import { generateAndDownloadReport } from "../utils/report";

interface IssueReportModalProps {
  opened: boolean;
  onClose: () => void;
}

interface UsageInfo {
  resolvedDate: string;
  aiUsage: string;
}

const PROJECT_PATH_MAP: Record<string, string> = {
  crm: "D:/projects/CRM",
  esb: "D:/projects/ESB",
  hrm: "D:/projects/HRM",
  "hrm-2-0": "D:/projects/HRM-2.0",
  bpm: "D:/projects/BPM",
  aquarius: "D:/projects/Aquarius",
  rda: "D:/projects/RDA",
}

const getProjectFromPage = (): string | null => {
  // 从 URL 路径中提取项目名，例如 /redmine/projects/esb/issues
  const pathMatch = window.location.pathname.match(/\/projects\/([^\/]+)/)
  if (pathMatch) {
    return pathMatch[1].toLowerCase()
  }
  
  // 备选：从页面标题或选择器中获取
  const projectSelect = document.querySelector('#project_quick_jump_box') as HTMLSelectElement
  if (projectSelect) {
    const selectedOption = projectSelect.querySelector('option[selected]')
    if (selectedOption) {
      const value = selectedOption.getAttribute('value') || ''
      const match = value.match(/\/projects\/([^?/]+)/)
      if (match) {
        return match[1].toLowerCase()
      }
    }
  }
  
  return null
}

const getRepoPath = (): string => {
  const project = getProjectFromPage()
  if (project && PROJECT_PATH_MAP[project]) {
    return PROJECT_PATH_MAP[project]
  }
  // 默认回退到 CRM
  return "D:/projects/CRM"
}

const getUsageFromPage = (): UsageInfo | null => {
  try {
    let resolvedDate = "";
    let aiUsage = "";

    // Check input fields first
    const inputs = document.querySelectorAll(
      'input[type="text"], input[type="number"]'
    );
    for (const input of inputs) {
      const row = input.closest("tr");
      const labelEl = row?.querySelector("th");
      const labelText = labelEl?.textContent?.trim() || "";
      const value = (input as HTMLInputElement).value;

      if (
        labelText.toLowerCase().includes("resolved") &&
        labelText.toLowerCase().includes("date")
      ) {
        resolvedDate = value;
      }
      if (labelText.toLowerCase().includes("usage")) {
        aiUsage = value.replace("%", "").trim();
      }
    }

    // Also check plain text cells (td elements) - th and td are siblings in same tr
    if (!aiUsage || !resolvedDate) {
      const rows = document.querySelectorAll("tr");
      for (const row of rows) {
        const ths = row.querySelectorAll("th");
        const tds = row.querySelectorAll("td");

        for (let i = 0; i < ths.length; i++) {
          const th = ths[i];
          const td = tds[i]; // Corresponding td by index
          if (!th || !td) continue;

          const labelText = th.textContent?.trim() || "";
          const value = td.textContent?.trim() || "";

          if (labelText.toLowerCase().includes("usage")) {
            aiUsage = value.replace("%", "").trim();
          }
          if (
            labelText.toLowerCase().includes("resolved") &&
            labelText.toLowerCase().includes("date")
          ) {
            resolvedDate = value;
          }
        }
      }
    }

    if (!resolvedDate && !aiUsage) return null;

    return { resolvedDate, aiUsage };
  } catch (error) {
    console.error("Failed to get Usage from page:", error);
    return null;
  }
};

const getIssueDataFromPage = (): IssueData | null => {
  try {
    const h2 = document.querySelector("h2");
    if (!h2) return null;
    const remindeId = h2.textContent || "";
    const titleText = h2.textContent?.trim() || "";
    const idMatch = titleText.match(/#(\d+)/);

    const id = idMatch ? idMatch[1] : "";
    const tracker = titleText.replace(/#\d+.*/, "").trim();

    const subjectEl = document.querySelector(".subject h3");
    const title =
      subjectEl?.textContent?.trim() ||
      titleText.replace(/^[^#]*#\d+\s*/, "").trim();

    const getText = (selector: string): string => {
      const el = document.querySelector(selector);
      return el?.textContent?.trim() || "";
    };

    const status = getText(".attributes .status");
    const priority = getText(".attributes .priority");
    const assignee =
      getText(".attributes .assigned-to a") ||
      getText(".attributes .assigned-to");
    const startDate = getText(".attributes .start-date");
    const estimatedHours = getText(".attributes .estimated-hours");

    const getComponent = (): string => {
      const ths = document.querySelectorAll(".attributes th");
      for (const th of ths) {
        if (th.textContent?.includes("Component")) {
          const td = th.nextElementSibling as HTMLElement;
          return td?.textContent?.trim() || "";
        }
      }
      return "";
    };
    const component = getComponent();

    const descEl = document.querySelector(".description .wiki");
    const description =
      descEl?.textContent?.replace(/Description/, "").trim() || "";

    const authorEl = document.querySelector(".author a.user");
    const author = authorEl?.textContent?.trim() || "";
    const issueData: IssueData = {
      id,
      title,
      tracker,
      status,
      priority,
      assignee,
      description,
      startDate,
      estimatedHours,
      component,
      author,
      redmineId: remindeId,
    };
    return issueData;
  } catch (error) {
    console.error("Failed to parse issue data:", error);
    return null;
  }
};

const formatDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const normalizeDate = (dateStr: string): string => {
  if (!dateStr) return formatDate();
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return formatDate();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const FileStatusBadge = ({ status }: { status: string }) => {
  const getStatusConfig = () => {
    switch (status.toUpperCase()) {
      case "A":
        return { color: "green", label: "新增", symbol: "+" };
      case "D":
        return { color: "red", label: "删除", symbol: "-" };
      case "M":
        return { color: "blue", label: "修改", symbol: "~" };
      default:
        return { color: "gray", label: status, symbol: "?" };
    }
  };
  const config = getStatusConfig();
  return (
    <Badge color={config.color} size="sm" variant="filled">
      {config.symbol} {config.label}
    </Badge>
  );
};

const FileListPanel = ({ files }: { files: HgFileChange[] }) => {
  if (files.length === 0) return null;

  return (
    <Paper p="sm" withBorder>
      <Group justify="space-between" mb="sm">
        <Text size="sm" fw={500}>
          修改的文件 ({files.length})
        </Text>
      </Group>
      <Table highlightOnHover striped>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>状态</Table.Th>
            <Table.Th>文件路径</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {files.map((file, index) => (
            <Table.Tr key={index}>
              <Table.Td w={80}>
                <FileStatusBadge status={file.status} />
              </Table.Td>
              <Table.Td>
                <Text size="xs" ff="monospace" lineClamp={1}>
                  {file.path}
                </Text>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  );
};

export const IssueReportModal = ({
  opened,
  onClose,
}: IssueReportModalProps) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issueData, setIssueData] = useState<IssueData | null>(null);
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState("");
  const [redmineId, setRedmineId] = useState("");
  const [modifier, setModifier] = useState("");
  const [reason, setReason] = useState("");
  const [solution, setSolution] = useState("");
  const [hgFiles, setHgFiles] = useState<HgFileChange[]>([]);
  const [hgLoading, setHgLoading] = useState(false);
  const [hgError, setHgError] = useState<string | null>(null);
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null);
  const [usageWarning, setUsageWarning] = useState<string | null>(null);
  const [llmLoading, setLlmLoading] = useState(false);
  const [issueType, setIssueType] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    if (opened) {
      const data = getIssueDataFromPage();
      const usage = getUsageFromPage();

      if (data) {
        setIssueData(data);
        setTitle(data.title);
        setModifier(data.assignee || data.author);
        setSolution(data.description);
        setSuccess(false);
        setError(null);
        setRedmineId(data.redmineId);
        setFiles("");
        setReason("");
        setHgFiles([]);
        setHgError(null);
        setUsageInfo(usage);
        setUsageWarning(null);
        setIssueType(data.tracker || "");
        setValidationErrors({});

        if (usage && (usage.aiUsage === "" || usage.aiUsage === "0")) {
          setUsageWarning("请在页面上填写 Usage");
        }

        if (data.id) {
          fetchHgData(data.id);
        }
      } else {
        setError("无法获取 Issue 信息");
      }
    }
  }, [opened]);

  const fetchHgData = async (issueId: string) => {
    setHgLoading(true);
    setHgError(null);

    try {
      const repoPath = getRepoPath();
      console.log(`Fetching HG data for issue ${issueId} from ${repoPath}`);
      
      const [fileList] = await Promise.all([
        getHgFilesByIssue(issueId, repoPath),
        getHgFilesDiffByIssue(issueId, repoPath),
      ]);

      setHgFiles(fileList);

      const fileSummary = fileList.map((f) => f.path).join(", ");
      setFiles(fileSummary);
    } catch (err) {
      console.error("Failed to fetch Hg data:", err);
      setHgError("获取 Mercurial 数据失败，请检查仓库路径和服务器");
    } finally {
      setHgLoading(false);
    }
  };

  const refreshUsage = () => {
    const usage = getUsageFromPage();
    setUsageInfo(usage);
    if (usage && (usage.aiUsage === "" || usage.aiUsage === "0")) {
      setUsageWarning("请在页面上填写 Usage");
    } else {
      setUsageWarning(null);
    }
  };

  const handleGenerateWithLLM = async () => {
    if (!issueData) {
      setError("Issue 数据为空");
      return;
    }

    setLlmLoading(true);
    setError(null);

    try {
      const modification = await llmService.generateModificationFromHg(
        hgFiles,
        issueData.description
      );

      setReason(modification);
    } catch (err) {
      console.error("LLM generation error:", err);
      setError(err instanceof Error ? err.message : "AI 生成失败");
    } finally {
      setLlmLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    const isBugOrEnhancement =
      issueType.toLowerCase() === "bug" ||
      issueType.toLowerCase() === "enhancement";

    if (isBugOrEnhancement) {
      if (!title.trim()) errors["title"] = "标题不能为空";
      if (!reason.trim()) errors["reason"] = "修改原因不能为空";
      if (!solution.trim()) errors["solution"] = "解决方案不能为空";
      if (!modifier.trim()) errors["modifier"] = "修改人不能为空";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleGenerate = async () => {
    if (!issueData) {
      setError("Issue 数据为空");
      return;
    }

    const usage = getUsageFromPage();
    if (!usage || usage.aiUsage === "" || usage.aiUsage === "0") {
      setError("请先在页面上填写AI Usage");
      return;
    }

    if (!validateForm()) {
      setError("请填写必填字段");
      return;
    }

    try {
      const formData: ReportFormData = {
        redmineId: redmineId,
        title: title,
        files: files || "无",
        modifier: modifier || "无",
        modifyDate: usage.resolvedDate || formatDate(),
        reason: reason || "无",
        solution: solution || "无",
        debuggingResults: {
          initialState: "",
          resultState: "",
        },
      };

      generateAndDownloadReport(issueData, formData);
      setSuccess(true);
    } catch (err) {
      console.error("Generate report error:", err);
      setError(err instanceof Error ? err.message : "生成报告失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Title order={4}>Issue 报告</Title>}
      size="xl"
      styles={{ body: { maxHeight: "70vh", overflowY: "auto" } }}
    >
      <LoadingOverlay visible={loading} />

      {error && (
        <Alert color="red" mb="md" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert color="green" mb="md" onClose={() => setSuccess(false)}>
          报告已生成：{issueData?.id}.xlsx
        </Alert>
      )}

      {issueData && (
        <Stack gap="md">
          <Paper p="sm" bg="gray.0" withBorder>
            <Group gap="xs" wrap="wrap">
              <Text size="sm" fw={500}>
                #{issueData.id}
              </Text>
              <Text size="sm">|</Text>
              <Text size="sm" lineClamp={1}>
                {issueData.title}
              </Text>
            </Group>
          </Paper>

          {usageWarning && (
            <Alert color="yellow" mb="md">
              {usageWarning}
              <Button variant="subtle" size="xs" ml="xs" onClick={refreshUsage}>
                刷新
              </Button>
            </Alert>
          )}

          {usageInfo && usageInfo.aiUsage && usageInfo.aiUsage !== "0" && (
            <Paper p="sm" withBorder>
              <Group gap="xs">
                <Badge color="green" variant="light">
                  Usage: {usageInfo.aiUsage}%
                </Badge>
                {usageInfo.resolvedDate && (
                  <Badge color="blue" variant="light">
                    Resolved: {usageInfo.resolvedDate}
                  </Badge>
                )}
              </Group>
            </Paper>
          )}

          <Select
            label="Issue 类型"
            placeholder="选择类型"
            value={issueType}
            onChange={(value) => {
              setIssueType(value || "");
              setValidationErrors({});
            }}
            data={[
              { value: "Bug", label: "Bug" },
              { value: "Enhancement", label: "Enhancement" },
              { value: "Feature", label: "Feature" },
              { value: "Task", label: "Task" },
              { value: "Support", label: "Support" },
            ]}
            searchable
            disabled={loading}
          />

          <TextInput
            label="Title"
            placeholder="RC-Condition: xxx"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (validationErrors["title"]) {
                setValidationErrors({ ...validationErrors, title: "" });
              }
            }}
            error={validationErrors["title"]}
            disabled={loading}
          />

          {hgLoading ? (
            <Paper p="sm" withBorder>
              <Group justify="center" py="md">
                <Text size="sm" c="gray">
                  正在获取修改文件...
                </Text>
              </Group>
            </Paper>
          ) : hgError ? (
            <Paper p="sm" withBorder>
              <Text size="sm" c="red">
                {hgError}
              </Text>
            </Paper>
          ) : (
            <FileListPanel files={hgFiles} />
          )}

          <Group grow>
            <TextInput
              label="修改人"
              placeholder="修改人"
              value={"Zhuo Cheng"}
              onChange={(e) => {
                setModifier(e.target.value);
                if (validationErrors["modifier"]) {
                  setValidationErrors({ ...validationErrors, modifier: "" });
                }
              }}
              error={validationErrors["modifier"]}
              disabled={loading}
            />
            <TextInput
              label="修改日期"
              type="date"
              value={normalizeDate(usageInfo?.resolvedDate || "")}
              onChange={(e) => {
                if (usageInfo) {
                  setUsageInfo({ ...usageInfo, resolvedDate: e.target.value });
                }
              }}
              disabled={loading}
            />
          </Group>

          <Textarea
            label="原因"
            placeholder="问题原因（来自问题描述）"
            minRows={2}
            value={solution}
            onChange={(e) => {
              setSolution(e.target.value);
              if (validationErrors["solution"]) {
                setValidationErrors({ ...validationErrors, solution: "" });
              }
            }}
            error={validationErrors["solution"]}
            disabled={loading || llmLoading}
          />

          <Textarea
            label={
              <Group justify="space-between">
                <Text>修改</Text>
                <Tooltip label="点击生成修改原因" position="top" withArrow>
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    onClick={handleGenerateWithLLM}
                    loading={llmLoading}
                    disabled={!issueData || !files}
                  >
                    <IconSparkles size={18} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            }
            placeholder="描述具体的解决方案（点击AI基于修改记录生成）"
            minRows={2}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (validationErrors["reason"]) {
                setValidationErrors({ ...validationErrors, reason: "" });
              }
            }}
            error={validationErrors["reason"]}
            disabled={loading || llmLoading}
          />

          <Group justify="flex-end">
            <Button
              color="dark"
              onClick={handleGenerate}
              disabled={!issueData || loading}
            >
              生成
            </Button>
            <Button
              variant="subtle"
              color="dark"
              onClick={onClose}
              disabled={loading}
            >
              取消
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
};
