import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/lib/i18n";
import { getTranslation } from "@/lib/i18n";

export const SolutionTextarea = ({
  value,
  error,
  onChange,
  disabled,
  llmLoading,
  locale,
}: {
  value: string;
  error?: string;
  onChange: (value: string) => void;
  disabled: boolean;
  llmLoading: boolean;
  locale: Locale;
}) => {
  const t = (key: string) => getTranslation(locale, key);
  if (disabled || llmLoading) {
    return (
      <div className="space-y-2">
        <Label>{t("issueReport.solution")}</Label>
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>{t("issueReport.solution")}</Label>
      <Textarea
        placeholder={t("issueReport.solutionPlaceholder")}
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || llmLoading}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};
