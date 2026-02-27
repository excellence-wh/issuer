import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { Locale } from "@/lib/i18n";
import { getTranslation } from "@/lib/i18n";

const normalizeDate = (dateStr: string): string => {
  if (!dateStr) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const ModifierDateRow = ({
  modifier,
  modifierError,
  resolvedDate,
  onModifierChange,
  onResolvedDateChange,
  loading,
  locale,
}: {
  modifier: string;
  modifierError?: string;
  resolvedDate: string;
  onModifierChange: (value: string) => void;
  onResolvedDateChange: (value: string) => void;
  loading: boolean;
  locale: Locale;
}) => {
  const t = (key: string) => getTranslation(locale, key);
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t("issueReport.modifier")}</Label>
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Label>{t("issueReport.modifiedDate")}</Label>
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>{t("issueReport.modifier")}</Label>
        <Input
          placeholder={t("issueReport.modifierPlaceholder")}
          value={modifier || "Zhuo Cheng"}
          onChange={(e) => onModifierChange(e.target.value)}
          disabled={loading}
        />
        {modifierError && <p className="text-sm text-red-500">{modifierError}</p>}
      </div>
      <div className="space-y-2">
        <Label>{t("issueReport.modifiedDate")}</Label>
        <Input
          type="date"
          value={normalizeDate(resolvedDate)}
          onChange={(e) => onResolvedDateChange(e.target.value)}
          disabled={loading}
        />
      </div>
    </div>
  );
};
