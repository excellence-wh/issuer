import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, FolderOpen, Database, Monitor, Globe } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { getTranslation, locales } from "@/lib/i18n";

interface SettingsData {
  repoPath: string;
  defaultProjectId: string;
  autoSave: boolean;
  theme: "light" | "dark" | "system";
  locale: Locale;
}

interface SettingsModalProps {
  opened: boolean;
  onClose: () => void;
  theme: "light" | "dark" | "system";
  locale: Locale;
  onThemeChange: (theme: "light" | "dark" | "system") => void;
  onLocaleChange: (locale: Locale) => void;
}

const DEFAULT_SETTINGS: SettingsData = {
  repoPath: "",
  defaultProjectId: "",
  autoSave: true,
  theme: "system",
  locale: "zh-CN",
};

const SETTINGS_STORAGE_KEY = "issuer-settings";

const loadSettings = (): SettingsData => {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch {
    console.error("Failed to load settings");
  }
  return DEFAULT_SETTINGS;
};

const saveSettings = (settings: SettingsData): void => {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    console.error("Failed to save settings");
  }
};

export function SettingsModal({
  opened,
  onClose,
  theme,
  locale,
  onThemeChange,
  onLocaleChange,
}: SettingsModalProps) {
  const [settings, setSettings] = useState<SettingsData>(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);

  const t = (key: string) => getTranslation(locale, key);

  useEffect(() => {
    if (opened) {
      const loaded = loadSettings();
      setSettings(loaded);
      if (loaded.locale !== locale) {
        onLocaleChange(loaded.locale);
      }
      setHasChanges(false);
    }
  }, [opened, locale, onLocaleChange]);

  const handleSave = useCallback(() => {
    saveSettings(settings);
    if (settings.theme !== theme) {
      onThemeChange(settings.theme);
    }
    if (settings.locale !== locale) {
      onLocaleChange(settings.locale);
    }
    setHasChanges(false);
    onClose();
  }, [settings, theme, locale, onThemeChange, onLocaleChange, onClose]);

  const handleChange = (key: keyof SettingsData, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  return (
    <Dialog open={opened} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings size={20} />
            {t("common.settings")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="repoPath" className="flex items-center gap-2">
              <FolderOpen size={16} />
              {t("common.repoPath")}
            </Label>
            <Input
              id="repoPath"
              value={settings.repoPath}
              onChange={(e) => handleChange("repoPath", e.target.value)}
              placeholder="D:/projects/CRM"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {t("common.repoPathDesc")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultProjectId" className="flex items-center gap-2">
              <Database size={16} />
              {t("common.defaultProject")}
            </Label>
            <Input
              id="defaultProjectId"
              value={settings.defaultProjectId}
              onChange={(e) => handleChange("defaultProjectId", e.target.value)}
              placeholder="crm, esb, hrm, etc."
            />
            <p className="text-xs text-muted-foreground">
              {t("common.defaultProjectDesc")}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Globe size={16} />
              {t("common.language")}
            </Label>
            <div className="flex gap-2">
              {locales.map((l) => (
                <Button
                  key={l.value}
                  variant={settings.locale === l.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleChange("locale", l.value)}
                >
                  {l.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Monitor size={16} />
              {t("common.theme")}
            </Label>
            <div className="flex gap-2">
              <Button
                variant={settings.theme === "light" ? "default" : "outline"}
                size="sm"
                onClick={() => handleChange("theme", "light")}
              >
                {t("common.light")}
              </Button>
              <Button
                variant={settings.theme === "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => handleChange("theme", "dark")}
              >
                {t("common.dark")}
              </Button>
              <Button
                variant={settings.theme === "system" ? "default" : "outline"}
                size="sm"
                onClick={() => handleChange("theme", "system")}
              >
                {t("common.system")}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoSave"
                checked={settings.autoSave}
                onChange={(e) => handleChange("autoSave", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="autoSave" className="cursor-pointer">
                {t("common.autoSave")}
              </Label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges}>
            {t("common.saveChanges")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { loadSettings };
