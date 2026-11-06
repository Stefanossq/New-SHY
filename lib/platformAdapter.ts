/**
 * @file Native Platform Adapter (Web Browser + Tauri Desktop .exe)
 * Transparently handles local disk file writes when running as a desktop app (.exe),
 * and standard JSZip/browser downloads when running inside a web browser.
 */
import { sanitizeRelativePath, base64ToBytes } from "./utils";

export interface ExportResult {
  success: boolean;
  mode: "browser-download" | "native-disk-write";
  path?: string;
  message: string;
}

export class PlatformAdapter {
  /**
   * Checks whether the application is running inside a Tauri Desktop container.
   */
  static isTauriApp(): boolean {
    return typeof window !== "undefined" && Boolean((window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__);
  }

  /**
   * Convenience alias for desktop container detection.
   */
  static isDesktop(): boolean {
    return this.isTauriApp();
  }

  /**
   * Returns current operating platform identifier.
   */
  static getPlatform(): "windows-desktop" | "web-browser" {
    return this.isTauriApp() ? "windows-desktop" : "web-browser";
  }

  /**
   * Exports project files.
   * If on Desktop (.exe): Writes folder directly to user's disk without browser prompt.
   * If on Browser: Downloads standard .zip file via saveAs.
   */
  static async exportProject(
    projectName: string,
    slug: string,
    files: Record<string, any>,
    fallbackDownloadZip: () => Promise<void>
  ): Promise<ExportResult> {
    if (this.isTauriApp()) {
      try {
        const tauri = (window as any).__TAURI__;
        // If Tauri dialog & fs plugins are available, invoke native folder picker
        if (tauri?.dialog?.open && tauri?.fs?.writeTextFile) {
          const selectedDir = await tauri.dialog.open({
            directory: true,
            multiple: false,
            title: `Selecione a pasta de destino para "${projectName || 'projeto'}"`,
          });

          if (!selectedDir) {
            return {
              success: false,
              mode: "native-disk-write",
              message: "Operação cancelada pelo usuário.",
            };
          }

          const safeSlug = sanitizeRelativePath(slug || "projeto") || "projeto";
          const targetDir = `${selectedDir}/${safeSlug}`;

          // Consistency: validate the whole file set before touching the disk, so an
          // unsafe path (e.g. "../../etc") aborts the export instead of half-writing it.
          const plan: Array<{ path: string; content: unknown }> = [];
          for (const [relativePath, content] of Object.entries(files || {})) {
            if (relativePath.endsWith(".placeholder")) continue;
            const safe = sanitizeRelativePath(relativePath);
            if (!safe) throw new Error(`Caminho inseguro bloqueado: ${relativePath}`);
            plan.push({ path: `${targetDir}/${safe}`, content });
          }

          for (const { path, content } of plan) {
            const dir = path.slice(0, path.lastIndexOf("/"));
            if (tauri.fs.mkdir) await tauri.fs.mkdir(dir, { recursive: true });
            if (typeof content === "string") {
              await tauri.fs.writeTextFile(path, content);
            } else if (content && typeof (content as any).base64 === "string") {
              // Binary assets (images) must be written as bytes — writing the base64 text corrupted them.
              const bytes = base64ToBytes((content as any).base64);
              if (tauri.fs.writeFile) await tauri.fs.writeFile(path, bytes);
              else await tauri.fs.writeTextFile(path, (content as any).base64);
            }
          }

          return {
            success: true,
            mode: "native-disk-write",
            path: targetDir,
            message: `Projeto gravado diretamente no disco em: ${targetDir}`,
          };
        }
      } catch (err) {
        console.warn("Tauri native write failed, falling back to ZIP download:", err);
      }
    }

    // Standard web browser fallback
    if (typeof fallbackDownloadZip === "function") {
      await fallbackDownloadZip();
    }

    return {
      success: true,
      mode: "browser-download",
      message: "Arquivo .zip baixado com sucesso pelo navegador.",
    };
  }
}
