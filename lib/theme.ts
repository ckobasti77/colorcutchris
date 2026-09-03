export type Theme = "day" | "night";

/**
 * Tema se drži na <html data-theme>. CSS tokeni (globals.css) reaguju odmah,
 * a komponente koje moraju da znaju (npr. 3D boje) slušaju "themechange".
 */
export function setTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (root.dataset.theme === theme) return;
  root.dataset.theme = theme;
  root.dispatchEvent(new CustomEvent<Theme>("themechange", { detail: theme }));
}

export function getTheme(): Theme {
  if (typeof document === "undefined") return "day";
  return (document.documentElement.dataset.theme as Theme) ?? "day";
}
