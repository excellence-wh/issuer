import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sparkles } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { getTranslation } from "@/lib/i18n";

export const ReasonTextarea = ({
  value,
  error,
  onChange,
  onGenerate,
  disabled,
  loading,
  llmLoading,
  locale,
}: {
  value: string;
  error?: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  disabled: boolean;
  loading: boolean;
  llmLoading: boolean;
  locale: Locale;
}) => {
  const t = (key: string) => getTranslation(locale, key);
  if (loading || llmLoading) {
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>{t("issueReport.reason")}</Label>
          <Skeleton className="h-8 w-8" />
        </div>
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>{t("issueReport.reason")}</Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onGenerate}
                disabled={disabled || llmLoading}
              >
                <Sparkles size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("issueReport.generateReasonTooltip")}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <Textarea
          placeholder={t("issueReport.reasonPlaceholder")}
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={loading || llmLoading}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </TooltipProvider>
  );
};
