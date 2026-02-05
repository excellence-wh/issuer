import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDescription } from "@/components/ui/alert";

interface UsageInfo {
  resolvedDate: string;
  aiUsage: string;
}

export const UsageInfoCard = ({
  usageInfo,
  usageWarning,
  onRefresh,
}: {
  usageInfo: UsageInfo | null;
  usageWarning: string | null;
  onRefresh: () => void;
}) => {
  if (usageWarning) {
    return (
      <Alert variant="default" className="bg-yellow-100 border-yellow-200">
        <AlertDescription className="flex items-center gap-2">
          {usageWarning}
          <Button variant="ghost" size="sm" onClick={onRefresh}>
            刷新
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (usageInfo && usageInfo.aiUsage && usageInfo.aiUsage !== "0") {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-100">
              Usage: {usageInfo.aiUsage}%
            </Badge>
            {usageInfo.resolvedDate && (
              <Badge variant="outline" className="bg-blue-100">
                Resolved: {usageInfo.resolvedDate}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};
