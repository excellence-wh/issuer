import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { HgFileChange } from "../../utils/hg";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  FileCode,
  Folder,
} from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { getTranslation } from "@/lib/i18n";

const FileStatusBadge = ({ status, locale }: { status: string; locale: Locale }) => {
  const t = (key: string) => getTranslation(locale, key);
  const getStatusConfig = () => {
    switch (status.toUpperCase()) {
      case "A":
        return { label: t("issueReport.new"), symbol: "+", color: "bg-green-100 text-green-700 border-green-200" };
      case "D":
        return { label: t("issueReport.deleted"), symbol: "-", color: "bg-red-100 text-red-700 border-red-200" };
      case "M":
        return { label: t("issueReport.modified"), symbol: "~", color: "bg-blue-100 text-blue-700 border-blue-200" };
      default:
        return { label: status, symbol: "?", color: "bg-gray-100 text-gray-700 border-gray-200" };
    }
  };
  const config = getStatusConfig();
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${config.color}`}>
      {config.symbol} {config.label}
    </span>
  );
};

const FilePathDisplay = ({
  path,
  onCopy,
  locale,
}: {
  path: string;
  onCopy: (fileName: string) => void;
  locale: Locale;
}) => {
  const t = (key: string) => getTranslation(locale, key);
  const parts = path.split("/");
  const fileName = parts.pop();
  const folderPath = parts.join("/");

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(fileName || path);
    onCopy(fileName || path);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 w-full overflow-hidden cursor-pointer">
            {folderPath && (
              <span className="text-muted-foreground text-xs shrink-0">../</span>
            )}
            <span className="text-sm font-medium truncate shrink-0">{fileName}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-md">
          <div className="space-y-2">
            <p className="text-xs font-mono break-all">{path}</p>
            <Button
              variant="outline"
              size="sm"
              className="w-full h-7 text-xs"
              onClick={handleCopy}
            >
              <Copy className="w-3 h-3 mr-1" />
              {t("issueReport.copyFileName")}
            </Button>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const FileListPanel = ({ files, locale }: { files: HgFileChange[]; locale: Locale }) => {
  const t = (key: string) => getTranslation(locale, key);
  const [isOpen, setIsOpen] = useState(false);
  const [viewAll, setViewAll] = useState(false);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  if (files.length === 0) return null;

  const displayFiles = viewAll ? files : files.slice(0, 5);
  const remainingCount = files.length - 5;

  const statusCounts = files.reduce((acc, file) => {
    const status = file.status.toUpperCase();
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleCopy = (fileName: string) => {
    setCopiedFile(fileName);
    setTimeout(() => setCopiedFile(null), 1500);
  };

  return (
    <Card className="overflow-hidden">
      <CardContent
        className={`p-4 ${isOpen ? "pb-2" : ""} cursor-pointer hover:bg-muted/30 transition-colors`}
        onClick={() => !isOpen && setIsOpen(true)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <FileCode className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">{t("issueReport.modifiedFiles")}</p>
              <p className="text-xs text-muted-foreground">{files.length} {t("issueReport.filesCount")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {Object.entries(statusCounts).map(([status, count]) => (
                <Badge key={status} variant="outline" className="text-xs">
                  {status === "A" && <span className="text-green-600">+</span>}
                  {status === "D" && <span className="text-red-600">-</span>}
                  {status === "M" && <span className="text-blue-600">~</span>}
                  <span className="ml-1">{count}</span>
                </Badge>
              ))}
            </div>
            {isOpen ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardContent>
      {isOpen && (
        <>
          <Separator />
          <div className="p-4 pt-3 space-y-1 overflow-hidden">
            {displayFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors overflow-hidden"
              >
                <FileStatusBadge status={file.status} locale={locale} />
                <div className="relative min-w-0 flex-1">
                  <FilePathDisplay path={file.path} onCopy={handleCopy} locale={locale} />
                  {copiedFile === (file.path.split("/").pop()) && (
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-green-600 bg-white px-1 rounded">
                      {t("issueReport.copied")}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {!viewAll && remainingCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  setViewAll(true);
                }}
              >
                <Folder className="w-4 h-4 mr-2" />
                {t("issueReport.viewRemaining")} {remainingCount} {t("issueReport.files")}
              </Button>
            )}
          </div>
        </>
      )}
    </Card>
  );
};
