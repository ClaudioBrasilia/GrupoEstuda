import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9">
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")} className="gap-2">
          <Sun className="h-4 w-4" />
          {t('settings.theme.light', 'Claro')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="gap-2">
          <Moon className="h-4 w-4" />
          {t('settings.theme.dark', 'Escuro')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className="gap-2">
          <Monitor className="h-4 w-4" />
          {t('settings.theme.system', 'Sistema')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ThemeSelector() {
  const { setTheme, theme } = useTheme();
  const { t } = useTranslation();

  const themes = [
    { value: "light", label: t('settings.theme.light', 'Claro'), icon: Sun },
    { value: "dark", label: t('settings.theme.dark', 'Escuro'), icon: Moon },
    { value: "system", label: t('settings.theme.system', 'Sistema'), icon: Monitor },
  ];

  return (
    <div className="flex gap-2">
      {themes.map(({ value, label, icon: Icon }) => (
        <Button
          key={value}
          variant={theme === value ? "default" : "outline"}
          className="flex-1 gap-2"
          onClick={() => setTheme(value)}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Button>
      ))}
    </div>
  );
}
