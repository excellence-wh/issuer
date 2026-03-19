import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { Locale } from "@/lib/i18n";
import { getTranslation } from "@/lib/i18n";

export const TitleInput = ({
  value,
  onChange,
  error,
  disabled,
  locale,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled: boolean;
  locale: Locale;
}) => {
  const t = (key: string) => getTranslation(locale, key);
  if (disabled) {
    return (
      <div className="space-y-2">
        <Label>{t("issueReport.titleLabel")}</Label>
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>{t("issueReport.titleLabel")}</Label>
      <Input
        placeholder="RC-Condition: xxx"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};
