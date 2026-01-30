import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { llmService } from "../services/llm";
import type { IssueData, ReportFormData } from "../types/issue";
import {
  getHgFilesByIssue,
  getHgFilesDiffByIssue,
  type HgFileChange,
} from "../utils/hg";
import { generateAndDownloadReport } from "../utils/report";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const pathMatch = window.location.pathname.match(/\/projects\/([^\/]+)/)
  if (pathMatch) {
    return pathMatch[1].toLowerCase()
  }
  
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
  return "D:/projects/CRM"
}

const getUsageFromPage = (): UsageInfo | null => {
  try {
    let resolvedDate = "";
    let aiUsage = "";

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

    if (!aiUsage || !resolvedDate) {
      const rows = document.querySelectorAll("tr");
      for (const row of rows) {
        const ths = row.querySelectorAll("th");
        const tds = row.querySelectorAll("td");

        for (let i = 0; i < ths.length; i++) {
          const th = ths[i];
          const td = tds[i];
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
        return { variant: "default" as const, label: "新增", symbol: "+" };
      case "D":
        return { variant: "destructive" as const, label: "删除", symbol: "-" };
      case "M":
        return { variant: "secondary" as const, label: "修改", symbol: "~" };
      default:
        return { variant: "outline" as const, label: status, symbol: "?" };
    }
  };
  const config = getStatusConfig();
  return (
    <Badge variant={config.variant} className="text-xs">
      {config.symbol} {config.label}
    </Badge>
  );
};

const FileListPanel = ({ files }: { files: HgFileChange[] }) => {
  if (files.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-3">
          <p className="text-sm font-medium">修改的文件 ({files.length})</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">状态</TableHead>
              <TableHead>文件路径</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((file, index) => (
              <TableRow key={index}>
                <TableCell className="w-20">
                  <FileStatusBadge status={file.status} />
                </TableCell>
                <TableCell>
                  <code className="text-xs truncate block">{file.path}</code>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
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

  const handleClose = () => {
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog open={opened} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Issue 报告</DialogTitle>
          <DialogDescription>
            生成 Issue 报告文档
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
                关闭
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-4 bg-green-100 border-green-200">
            <AlertDescription className="flex justify-between items-center">
              报告已生成：{issueData?.id}.xlsx
              <Button variant="ghost" size="sm" onClick={() => setSuccess(false)}>
                关闭
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {issueData && (
          <div className="space-y-4 mt-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">#{issueData.id}</span>
                  <span className="text-sm">|</span>
                  <span className="text-sm truncate">{issueData.title}</span>
                </div>
              </CardContent>
            </Card>

            {usageWarning && (
              <Alert variant="default" className="bg-yellow-100 border-yellow-200">
                <AlertDescription className="flex items-center gap-2">
                  {usageWarning}
                  <Button variant="ghost" size="sm" onClick={refreshUsage}>
                    刷新
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {usageInfo && usageInfo.aiUsage && usageInfo.aiUsage !== "0" && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-100">
                      Usage: {usageInfo.aiUsage}%
                    </Badge>
                    {usageInfo.resolvedDate && (
                      <Badge variant="outline" className="bg-blue-100">
                        Resolved: {usageInfo.resolvedDate}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              <Label>Issue 类型</Label>
              <Select
                value={issueType}
                onValueChange={(value) => {
                  setIssueType(value);
                  setValidationErrors({});
                }}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bug">Bug</SelectItem>
                  <SelectItem value="Enhancement">Enhancement</SelectItem>
                  <SelectItem value="Feature">Feature</SelectItem>
                  <SelectItem value="Task">Task</SelectItem>
                  <SelectItem value="Support">Support</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="RC-Condition: xxx"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (validationErrors["title"]) {
                    setValidationErrors({ ...validationErrors, title: "" });
                  }
                }}
                disabled={loading}
              />
              {validationErrors["title"] && (
                <p className="text-sm text-red-500">{validationErrors["title"]}</p>
              )}
            </div>

            {hgLoading ? (
              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-center items-center py-4">
                    <Skeleton className="h-4 w-32" />
                  </div>
                </CardContent>
              </Card>
            ) : hgError ? (
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-red-500">{hgError}</p>
                </CardContent>
              </Card>
            ) : (
              <FileListPanel files={hgFiles} />
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>修改人</Label>
                <Input
                  placeholder="修改人"
                  value={modifier || "Zhuo Cheng"}
                  onChange={(e) => {
                    setModifier(e.target.value);
                    if (validationErrors["modifier"]) {
                      setValidationErrors({ ...validationErrors, modifier: "" });
                    }
                  }}
                  disabled={loading}
                />
                {validationErrors["modifier"] && (
                  <p className="text-sm text-red-500">{validationErrors["modifier"]}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>修改日期</Label>
                <Input
                  type="date"
                  value={normalizeDate(usageInfo?.resolvedDate || "")}
                  onChange={(e) => {
                    if (usageInfo) {
                      setUsageInfo({ ...usageInfo, resolvedDate: e.target.value });
                    }
                  }}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>原因</Label>
              <Textarea
                placeholder="问题原因（来自问题描述）"
                rows={2}
                value={solution}
                onChange={(e) => {
                  setSolution(e.target.value);
                  if (validationErrors["solution"]) {
                    setValidationErrors({ ...validationErrors, solution: "" });
                  }
                }}
                disabled={loading || llmLoading}
              />
              {validationErrors["solution"] && (
                <p className="text-sm text-red-500">{validationErrors["solution"]}</p>
              )}
            </div>

            <TooltipProvider>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>修改</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleGenerateWithLLM}
                        disabled={!issueData || !files || llmLoading}
                      >
                        <Sparkles size={18} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>点击生成修改原因</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Textarea
                  placeholder="描述具体的解决方案（点击AI基于修改记录生成）"
                  rows={2}
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    if (validationErrors["reason"]) {
                      setValidationErrors({ ...validationErrors, reason: "" });
                    }
                  }}
                  disabled={loading || llmLoading}
                />
                {validationErrors["reason"] && (
                  <p className="text-sm text-red-500">{validationErrors["reason"]}</p>
                )}
              </div>
            </TooltipProvider>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                onClick={handleGenerate}
                disabled={!issueData || loading}
              >
                生成
              </Button>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                取消
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
