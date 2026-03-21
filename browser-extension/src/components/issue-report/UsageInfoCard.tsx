import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Locale } from "@/lib/i18n";
import { getTranslation } from "@/lib/i18n";

interface UsageInfo {
  resolvedDate: string;
  aiUsage: string;
}

export const UsageInfoCard = ({
  usageInfo,
  usageWarning,
  locale,
}: {
  usageInfo: UsageInfo | null;
  usageWarning: string | null;
  locale: Locale;
}) => {
  const t = (key: string) => getTranslation(locale, key);
  if (usageWarning) {
    return (
      <Alert variant="default" className="bg-yellow-100 border-yellow-200">
        <AlertDescription>
          {usageWarning}
        </AlertDescription>
      </Alert>
    );
  }

  if (usageInfo && usageInfo.aiUsage && usageInfo.aiUsage !== "0") {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
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
