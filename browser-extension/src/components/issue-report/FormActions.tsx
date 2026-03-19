import { Button } from "@/components/ui/button";
import { Save, Trash2 } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { getTranslation } from "@/lib/i18n";

export const FormActions = ({
  lastSaved,
  hasDraft,
  onClearDraft,
  onGenerate,
  onClose,
  disabled,
  locale,
}: {
  lastSaved: string | null;
  hasDraft: boolean;
  onClearDraft: () => void;
  onGenerate: () => void;
  onClose: () => void;
  disabled: boolean;
  locale: Locale;
}) => {
  const t = (key: string) => getTranslation(locale, key);
  return (
    <div className="flex justify-between items-center gap-2 pt-4 border-t mt-4">
      <div className="flex items-center gap-2">
        {lastSaved && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Save className="w-3.5 h-3.5" />
            {t("issueReport.autoSaved")} {lastSaved}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        {hasDraft && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearDraft}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            {t("issueReport.clearDraft")}
          </Button>
        )}
        <Button onClick={onGenerate} disabled={disabled}>
          {t("common.generate")}
        </Button>
        <Button variant="outline" onClick={onClose} disabled={disabled}>
          {t("common.cancel")}
        </Button>
      </div>
    </div>
  );
};
