import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

export const SolutionTextarea = ({
  value,
  error,
  onChange,
  disabled,
  llmLoading,
}: {
  value: string;
  error?: string;
  onChange: (value: string) => void;
  disabled: boolean;
  llmLoading: boolean;
}) => {
  if (disabled || llmLoading) {
    return (
      <div className="space-y-2">
        <Label>解决方案</Label>
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>解决方案</Label>
      <Textarea
        placeholder="描述具体的解决方案（点击AI基于修改记录生成）"
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || llmLoading}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};
