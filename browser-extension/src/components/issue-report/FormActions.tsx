import { Button } from "@/components/ui/button";
import { Save, Trash2 } from "lucide-react";

export const FormActions = ({
  lastSaved,
  hasDraft,
  onClearDraft,
  onGenerate,
  onClose,
  disabled,
}: {
  lastSaved: string | null;
  hasDraft: boolean;
  onClearDraft: () => void;
  onGenerate: () => void;
  onClose: () => void;
  disabled: boolean;
}) => {
  return (
    <div className="flex justify-between items-center gap-2 pt-4 border-t mt-4">
      <div className="flex items-center gap-2">
        {lastSaved && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Save className="w-3.5 h-3.5" />
            自动保存于 {lastSaved}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        {hasDraft && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearDraft}
            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            清空草稿
          </Button>
        )}
        <Button onClick={onGenerate} disabled={disabled}>
          生成
        </Button>
        <Button variant="outline" onClick={onClose} disabled={disabled}>
          取消
        </Button>
      </div>
    </div>
  );
};
