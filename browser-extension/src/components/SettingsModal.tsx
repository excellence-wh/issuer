import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, FolderOpen, Database, Monitor, Globe, ChevronsUpDown, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { getTranslation, locales } from "@/lib/i18n";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

interface SettingsData {
  repoPath: string;
  defaultProjectIds: string[];
  autoSave: boolean;
  theme: "light" | "dark" | "system";
  locale: Locale;
}

interface Project {
  id: string;
  name: string;
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
  defaultProjectIds: [],
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [openProjects, setOpenProjects] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');
  const [loadingProjects, setLoadingProjects] = useState(false);

  const t = (key: string) => getTranslation(locale, key);

  useEffect(() => {
    if (opened) {
      const loaded = loadSettings();
      setSettings(loaded);
      if (loaded.locale !== locale) {
        onLocaleChange(loaded.locale);
      }
      setHasChanges(false);
      setProjectSearch('');
      fetchProjects();
    }
  }, [opened, locale, onLocaleChange]);

  const fetchProjects = async () => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
    setLoadingProjects(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/redmine/projects`);
      const data = await response.json();
      if (data.success) {
        setProjects(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoadingProjects(false);
    }
  };

  const toggleProject = (projectId: string) => {
    const newIds = settings.defaultProjectIds.includes(projectId)
      ? settings.defaultProjectIds.filter(id => id !== projectId)
      : [...settings.defaultProjectIds, projectId];
    handleChange('defaultProjectIds', newIds);
  };

  const selectedProjectsLabel = settings.defaultProjectIds.length > 0
    ? settings.defaultProjectIds
        .map(id => projects.find(p => p.id === id)?.name || id)
        .join(', ')
    : t('common.select');

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

  const handleChange = (key: keyof SettingsData, value: string | boolean | string[]) => {
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
            <Label className="flex items-center gap-2">
              <FolderOpen size={16} />
              {t("common.repoPath")}
            </Label>
            <div className="flex gap-2">
              <Input
                value={settings.repoPath}
                onChange={(e) => handleChange("repoPath", e.target.value)}
                placeholder="D:/projects/CRM"
                className="font-mono text-sm flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.hg,.git';
                  input.onchange = (e) => {
                    const files = (e.target as HTMLInputElement).files;
                    if (files && files.length > 0) {
                      const path = files[0].webkitRelativePath.split('/')[0];
                      handleChange('repoPath', path);
                    }
                  };
                  input.click();
                }}
              >
                <FolderOpen size={16} />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("common.repoPathDesc")}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Database size={16} />
              {t("common.defaultProject")}
            </Label>
            <Popover open={openProjects} onOpenChange={setOpenProjects}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openProjects}
                  className="w-full justify-between"
                  disabled={loadingProjects}
                >
                  <span className="truncate">{selectedProjectsLabel}</span>
                  {loadingProjects ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <div className="p-2 border-b">
                  <Input
                    placeholder={t("common.select")}
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                    className="h-8"
                  />
                </div>
                <div className="max-h-60 overflow-auto p-2">
                  {projects
                    .filter(p => p.name.toLowerCase().includes(projectSearch.toLowerCase()))
                    .map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center space-x-2 py-2 px-2 hover:bg-accent rounded cursor-pointer"
                        onClick={() => toggleProject(project.id)}
                      >
                        <Checkbox
                          checked={settings.defaultProjectIds.includes(project.id)}
                          onCheckedChange={() => toggleProject(project.id)}
                        />
                        <span className="text-sm">{project.name}</span>
                      </div>
                    ))}
                </div>
              </PopoverContent>
            </Popover>
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
