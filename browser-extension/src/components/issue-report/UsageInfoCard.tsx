import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDescription } from "@/components/ui/alert";
import type { Locale } from "@/lib/i18n";
import { getTranslation } from "@/lib/i18n";

interface UsageInfo {
  resolvedDate: string;
  aiUsage: string;
}

export const UsageInfoCard = ({
  usageInfo,
  usageWarning,
  onRefresh,
  locale,
}: {
  usageInfo: UsageInfo | null;
  usageWarning: string | null;
  onRefresh: () => void;
  locale: Locale;
}) => {
  const t = (key: string) => getTranslation(locale, key);
  if (usageWarning) {
    return (
      <Alert variant="default" className="bg-yellow-100 border-yellow-200">
        <AlertDescription className="flex items-center gap-2">
          {usageWarning}
          <Button variant="ghost" size="sm" onClick={onRefresh}>
            {t("common.refresh")}
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
            <Badge variant="success">
              {t("usage.aiUsage")}: {usageInfo.aiUsage}%
            </Badge>
            {usageInfo.resolvedDate && (
              <Badge variant="secondary">
                {t("weekly.resolvedDate")}: {usageInfo.resolvedDate}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};
