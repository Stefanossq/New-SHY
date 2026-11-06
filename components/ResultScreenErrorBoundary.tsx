import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RotateCcw, Download, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  onReset?: () => void;
  projectFiles?: Record<string, any>;
  projectName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ResultScreenErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ResultScreenErrorBoundary] Caught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleExportFallback = () => {
    const files = this.props.projectFiles || {};
    const blob = new Blob([JSON.stringify(files, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(this.props.projectName || "projeto").toLowerCase().replace(/\s+/g, "-")}-raw-backup.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  public render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.message || "Erro de renderização desconhecido.";

      return (
        <div className="bg-[#0D131F] border border-red-500/30 rounded-xl p-6 md:p-8 w-full flex flex-col space-y-6 animate-fade-in relative text-xs font-sans shadow-xl">
          <div className="flex items-start gap-4 pb-5 border-b border-gray-800">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
                  Falha Protegida na Renderização do Projeto
                </h2>
                <span className="text-[11px] font-mono text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">
                  Error Boundary Ativo
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Um erro inesperado ocorreu durante a exibição dos componentes de resultado. O gerador interceptou a falha para evitar o encerramento da aplicação. Seus arquivos gerados permanecem íntegros na memória.
              </p>
            </div>
          </div>

          <div className="bg-black/50 border border-red-500/20 rounded-lg p-4 font-mono text-[11px] text-red-300 overflow-x-auto space-y-2">
            <div className="font-semibold text-red-400 flex items-center gap-2">
              <span>Stack trace do componente:</span>
            </div>
            <div className="text-gray-300 whitespace-pre-wrap">{errorMsg}</div>
            {this.state.errorInfo?.componentStack && (
              <details className="text-gray-500 text-[10px] mt-2 cursor-pointer">
                <summary className="hover:text-gray-300">Exibir rastro detalhado do React</summary>
                <pre className="mt-2 whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
              </details>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-800">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={this.handleRetry}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Tentar Renderizar Novamente</span>
              </button>

              {this.props.onReset && (
                <button
                  onClick={this.props.onReset}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-800 hover:border-gray-700 bg-gray-900 hover:bg-gray-850 text-gray-300 hover:text-white transition-colors cursor-pointer font-medium"
                >
                  <RotateCcw className="w-4 h-4 text-gray-400" />
                  <span>Voltar para Seleção de Projetos</span>
                </button>
              )}
            </div>

            {this.props.projectFiles && (
              <button
                onClick={this.handleExportFallback}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-emerald-500/30 hover:border-emerald-500/50 bg-emerald-500/10 text-emerald-300 hover:text-white transition-colors cursor-pointer text-xs font-semibold"
                title="Baixar JSON bruto com todos os arquivos gerados"
              >
                <Download className="w-4 h-4" />
                <span>Exportar Arquivos em Backup (JSON)</span>
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
