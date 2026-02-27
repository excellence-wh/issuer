import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { Locale } from "@/lib/i18n";
import { getTranslation } from "@/lib/i18n";

const ISSUE_TYPES = [
  "Bug",
  "Enhancement",
  "Feature",
  "Task",
  "Support",
  "Review Request",
] as const;

export const IssueTypeSelect = ({
  value,
  onChange,
  disabled,
  locale,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  locale: Locale;
}) => {
  const t = (key: string) => getTranslation(locale, key);
  if (disabled) {
    return (
      <div className="space-y-2">
        <Label>{t("issueReport.issueType")}</Label>
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>{t("issueReport.issueType")}</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t("issueReport.selectType")} />
        </SelectTrigger>
        <SelectContent>
          {ISSUE_TYPES.map((type) => (
            <SelectItem key={type} value={type}>
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
