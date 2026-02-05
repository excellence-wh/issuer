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

export const ReasonTextarea = ({
  value,
  error,
  onChange,
  onGenerate,
  disabled,
  loading,
  llmLoading,
}: {
  value: string;
  error?: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  disabled: boolean;
  loading: boolean;
  llmLoading: boolean;
}) => {
  if (loading || llmLoading) {
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>修改原因</Label>
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
          <Label>修改原因</Label>
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
              <p>点击生成修改原因</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <Textarea
          placeholder="描述具体的修改原因（点击AI基于修改记录生成）"
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={loading || llmLoading}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    </TooltipProvider>
  );
};
