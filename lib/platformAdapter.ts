/**
 * @file Native Platform Adapter (Web Browser + Tauri Desktop .exe)
 * Transparently handles local disk file writes when running as a desktop app (.exe),
 * and standard JSZip/browser downloads when running inside a web browser.
 */

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

          const targetDir = `${selectedDir}/${slug || 'projeto'}`;
          // Write all files directly to local disk
          if (files && typeof files === "object") {
            for (const [relativePath, content] of Object.entries(files)) {
              const fileString = typeof content === "string" ? content : (content?.base64 || "");
              const fullFilePath = `${targetDir}/${relativePath}`;
              await tauri.fs.writeTextFile(fullFilePath, fileString);
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
