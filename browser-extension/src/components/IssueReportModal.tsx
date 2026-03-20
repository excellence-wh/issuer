import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCallback, useEffect, useState } from "react";
import { showToast } from "../App";
import { llmService } from "../services/llm";
import type { IssueData, ReportFormData } from "../types/issue";
import {
  getHgFilesByIssue,
  getHgFilesDiffByIssue,
  type HgFileChange,
} from "../utils/hg";
import { generateAndDownloadReport } from "../utils/report";
import {
  FormActions,
  IssueInfoHeader,
  IssueTypeSelect,
  ModifierDateRow,
  ReasonTextarea,
  SolutionTextarea,
  TitleInput,
} from "./issue-report";
import { FileListPanel } from "./issue-report/FileListPanel";
import type { Locale } from "@/lib/i18n";
import { getTranslation } from "@/lib/i18n";

interface IssueReportModalProps {
  opened: boolean;
  onClose: () => void;
  locale: Locale;
}

interface UsageInfo {
  resolvedDate: string;
  aiUsage: string;
}

interface FormDraft {
  issueId: string;
  title: string;
  modifier: string;
  reason: string;
  solution: string;
  files: string;
  issueType: string;
  savedAt: string;
}

const DRAFT_STORAGE_KEY = "issuer-report-draft";
const AUTOSAVE_INTERVAL = 3000;

const PROJECT_PATH_MAP: Record<string, string> = {
  crm: "D:/projects/CRM",
  esb: "D:/projects/ESB",
  hrm: "D:/projects/HRM",
  "hrm-2-0": "D:/projects/HRM-2.0",
  bpm: "D:/projects/BPM",
  aquarius: "D:/projects/Aquarius",
  rda: "D:/projects/RDA",
};

const getProjectFromPage = (): string | null => {
  const pathMatch = window.location.pathname.match(/\/projects\/([^\/]+)/);
  if (pathMatch) {
    return pathMatch[1].toLowerCase();
  }

  const projectSelect = document.querySelector(
    "#project_quick_jump_box"
  ) as HTMLSelectElement;
  if (projectSelect) {
    const selectedOption = projectSelect.querySelector("option[selected]");
    if (selectedOption) {
      const value = selectedOption.getAttribute("value") || "";
      const match = value.match(/\/projects\/([^?/]+)/);
      if (match) {
        return match[1].toLowerCase();
      }
    }
  }

  return null;
};

const getRepoPath = (): string => {
  const project = getProjectFromPage();
  if (project && PROJECT_PATH_MAP[project]) {
    return PROJECT_PATH_MAP[project];
  }
  return "D:/projects/CRM";
};

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

export const IssueReportModal = ({
  opened,
  onClose,
  locale,
}: IssueReportModalProps) => {
  const t = (key: string) => getTranslation(locale, key);

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
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(false);

  const loadDraft = (currentIssueId: string): FormDraft | null => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const draft: FormDraft = JSON.parse(saved);
        if (draft.issueId === currentIssueId) {
          return draft;
        }
      }
    } catch {
      // 解析失败，忽略
    }
    return null;
  };

  const saveDraft = useCallback(() => {
    if (!issueData?.id) return;

    const draft: FormDraft = {
      issueId: issueData.id,
      title,
      modifier,
      reason,
      solution,
      files,
      issueType,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    setLastSaved(new Date().toLocaleTimeString(locale));
    setHasDraft(true);
  }, [issueData?.id, title, modifier, reason, solution, files, issueType]);

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setHasDraft(false);
    setLastSaved(null);
    showToast("success", t("toast.draftCleared"));
  };

  useEffect(() => {
    if (!opened || !issueData?.id) return;

    const timer = setInterval(() => {
      saveDraft();
    }, AUTOSAVE_INTERVAL);

    return () => clearInterval(timer);
  }, [opened, issueData?.id, saveDraft]);

  useEffect(() => {
    if (!opened || !issueData?.id) return;

    const timer = setTimeout(() => {
      saveDraft();
    }, 1000);

    return () => clearTimeout(timer);
  }, [title, modifier, reason, solution, files, issueType, opened, issueData?.id, saveDraft]);

  useEffect(() => {
    if (opened) {
      const data = getIssueDataFromPage();
      const usage = getUsageFromPage();

      if (data) {
        setIssueData(data);
        setSuccess(false);
        setError(null);
        setRedmineId(data.redmineId);
        setFiles("");
        setReason("");
        setHgFiles([]);
        setHgError(null);
        setUsageInfo(usage);
        setUsageWarning(null);
        setValidationErrors({});

        const draft = loadDraft(data.id);
        if (draft) {
          setTitle(draft.title || data.title);
          setModifier(draft.modifier || data.assignee || data.author);
          setSolution(draft.solution || data.description);
          setReason(draft.reason || "");
          setFiles(draft.files || "");
          setIssueType(draft.issueType || data.tracker || "");
          setHasDraft(true);
          setLastSaved(new Date(draft.savedAt).toLocaleTimeString(locale));
          showToast(
            "info",
            t("toast.draftRestored"),
            `${t("toast.lastSaved")}: ${new Date(draft.savedAt).toLocaleString(locale)}`
          );
        } else {
          setTitle(data.title);
          setModifier(data.assignee || data.author);
          setSolution(data.description);
          setReason("");
          setIssueType(data.tracker || "");
          setHasDraft(false);
          setLastSaved(null);
        }

        if (usage && (usage.aiUsage === "" || usage.aiUsage === "0")) {
          setUsageWarning(t("usage.fillUsageOnPage"));
        }

        if (data.id) {
          fetchHgData(data.id);
        }
      } else {
        setError(t("issue.issueNotFound"));
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
      const errorMsg = t("issue.hgDataFailed");
      setHgError(errorMsg);
      showToast("error", t("toast.networkError"), errorMsg);
    } finally {
      setHgLoading(false);
    }
  };

  const handleGenerateWithLLM = async () => {
    if (!issueData) {
      setError(t("issue.issueEmpty"));
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
      const errorMsg = err instanceof Error ? err.message : t("toast.aiGenerateError");
      setError(errorMsg);
      showToast("error", t("toast.aiGenerateError"), errorMsg);
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
      if (!title.trim()) errors["title"] = t("issue.titleRequired");
      // Reason is optional now — allow generating report without filling it
      if (!solution.trim()) errors["solution"] = t("issue.solutionRequired");
      if (!modifier.trim()) errors["modifier"] = t("issue.modifierRequired");
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleGenerate = async () => {
    if (!issueData) {
      setError(t("issue.issueEmpty"));
      return;
    }

    if (!validateForm()) {
      setError(t("issue.fillRequiredFields"));
      return;
    }

    const usage = getUsageFromPage();

    try {
      const formData: ReportFormData = {
        redmineId: redmineId,
        title: title,
        files: files || t("common.none"),
        modifier: modifier || t("common.none"),
        modifyDate: usage?.resolvedDate || formatDate(),
        reason: reason || t("common.none"),
        solution: solution || t("common.none"),
        debuggingResults: {
          initialState: "",
          resultState: "",
        },
      };

      generateAndDownloadReport(issueData, formData, locale);
      setSuccess(true);
      showToast("success", t("toast.reportGenerated"), t("toast.downloaded"));

      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setHasDraft(false);
      setLastSaved(null);
    } catch (err) {
      console.error("Generate report error:", err);
      const errorMsg = err instanceof Error ? err.message : t("toast.reportGenerateError");
      setError(errorMsg);
      showToast("error", t("toast.reportGenerateError"), errorMsg);
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
    <Dialog open={opened} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="w-[95vw] max-w-[800px] max-h-[85vh] overflow-hidden flex flex-col"
        showCloseButton={true}
      >
        <DialogHeader>
          <DialogTitle>{t("issueReport.title")}</DialogTitle>
          <DialogDescription>{t("issueReport.generateDocument")}</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-4">
              <AlertDescription className="flex justify-between items-center">
                {error}
                <Button variant="ghost" size="sm" onClick={() => setError(null)}>
                  {t("common.close")}
                </Button>
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert variant="success" className="mb-4">
            <AlertDescription className="flex justify-between items-center">
              {t("toast.reportGenerated")}: {issueData?.id}.xlsx
              <Button variant="ghost" size="sm" onClick={() => setSuccess(false)}>
                {t("common.close")}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {issueData && (
          <div className="space-y-4 mt-4 overflow-y-auto max-h-[calc(85vh-180px)] pr-2">
            <IssueInfoHeader
              issueData={issueData}
              usageInfo={usageInfo}
              usageWarning={usageWarning}
              locale={locale}
            />

            <IssueTypeSelect
              value={issueType}
              onChange={(value) => {
                setIssueType(value);
                setValidationErrors({});
              }}
              disabled={loading}
              locale={locale}
            />

            <TitleInput
              value={title}
              onChange={setTitle}
              error={validationErrors["title"]}
              disabled={loading}
              locale={locale}
            />

            {hgLoading ? (
              <div className="h-20 bg-muted/30 rounded-lg animate-pulse" />
            ) : hgError ? (
              <div className="p-4 text-sm rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
                {hgError}
              </div>
            ) : (
              <FileListPanel files={hgFiles} locale={locale} />
            )}

            <ModifierDateRow
              modifier={modifier}
              modifierError={validationErrors["modifier"]}
              resolvedDate={usageInfo?.resolvedDate || ""}
              onModifierChange={setModifier}
              onResolvedDateChange={(value) =>
                usageInfo && setUsageInfo({ ...usageInfo, resolvedDate: value })
              }
              loading={loading}
              locale={locale}
            />

            <SolutionTextarea
              value={solution}
              error={validationErrors["solution"]}
              onChange={setSolution}
              disabled={loading}
              llmLoading={llmLoading}
              locale={locale}
            />

            <ReasonTextarea
              value={reason}
              error={validationErrors["reason"]}
              onChange={setReason}
              onGenerate={handleGenerateWithLLM}
              disabled={!issueData || !files}
              loading={loading}
              llmLoading={llmLoading}
              locale={locale}
            />

            <FormActions
              lastSaved={lastSaved}
              hasDraft={hasDraft}
              onClearDraft={clearDraft}
              onGenerate={handleGenerate}
              onClose={handleClose}
              disabled={!issueData || loading}
              locale={locale}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
