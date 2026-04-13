export const OPENWORK_DEPLOYMENT_ENV_VAR = "VITE_OPENWORK_DEPLOYMENT";

export type WorkspaceAgentDeployment = "desktop" | "web";

function normalizeDeployment(value: string | undefined): WorkspaceAgentDeployment {
  const normalized = value?.trim().toLowerCase();
  return normalized === "web" ? "web" : "desktop";
}

export function getWorkspaceAgentDeployment(): WorkspaceAgentDeployment {
  const envValue =
    typeof import.meta !== "undefined" && typeof import.meta.env?.VITE_OPENWORK_DEPLOYMENT === "string"
      ? import.meta.env.VITE_OPENWORK_DEPLOYMENT
      : undefined;

  return normalizeDeployment(envValue);
}

export function isWebDeployment(): boolean {
  return getWorkspaceAgentDeployment() === "web";
}

export function isDesktopDeployment(): boolean {
  return getWorkspaceAgentDeployment() === "desktop";
}
