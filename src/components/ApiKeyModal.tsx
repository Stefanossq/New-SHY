import { useEffect, useState } from 'react';
import { Eye, EyeOff, KeyRound, Trash2, X } from 'lucide-react';
import { callDesktop } from '../lib/platform';
import { Button, Notice } from './ui';

/** Só no app desktop: guarda a chave Gemini no Gerenciador de Credenciais do Windows. */
export default function ApiKeyModal({ open, onClose, onChanged }: { open: boolean; onClose: () => void; onChanged: () => void }) {
  const [key, setKey] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'info' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    setMsg(null);
    setKey('');
    callDesktop<boolean>('has_api_key').then(setHasKey).catch((e) => setMsg({ tone: 'error', text: String(e) }));
  }, [open]);

  if (!open) return null;

  const run = async (fn: () => Promise<string>) => {
    setBusy(true);
    setMsg(null);
    try {
      setMsg({ tone: 'info', text: await fn() });
      onChanged();
    } catch (e) {
      setMsg({ tone: 'error', text: String(e) });
    } finally {
      setBusy(false);
    }
  };

  const saveAndTest = () =>
    run(async () => {
      if (key.trim()) {
        await callDesktop('save_api_key', { key: key.trim() });
        setHasKey(true);
        setKey('');
      }
      return callDesktop<string>('test_api_key');
    });

  const remove = () =>
    run(async () => {
      await callDesktop('delete_api_key');
      setHasKey(false);
      return 'Chave removida deste computador.';
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md gp-panel p-6">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold text-cream"><KeyRound className="h-5 w-5 text-lav-soft" /> Chave da API Gemini</h2>
          <button onClick={onClose} aria-label="Fechar" className="text-muted hover:text-cream"><X className="h-5 w-5" /></button>
        </div>
        <p className="mt-2 text-sm text-muted">
          Fica salva no Gerenciador de Credenciais do Windows, nunca em arquivo. Crie a sua em aistudio.google.com/apikey.
        </p>
        <div className="mt-4 flex gap-2">
          <input
            type={show ? 'text' : 'password'}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder={hasKey ? 'Chave já salva — cole outra para trocar' : 'Cole sua chave aqui'}
            className="flex-1 rounded-lg border border-line bg-bg px-3 py-2 text-sm text-cream outline-none focus:border-lav-soft"
          />
          <Button variant="ghost" onClick={() => setShow(!show)} aria-label={show ? 'Ocultar' : 'Mostrar'}>
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        {msg && <div className="mt-4"><Notice tone={msg.tone}>{msg.text}</Notice></div>}
        <div className="mt-5 flex justify-between gap-2">
          {hasKey ? <Button variant="ghost" onClick={remove} disabled={busy}><Trash2 className="h-4 w-4" /> Remover</Button> : <span />}
          <Button onClick={saveAndTest} disabled={busy || (!key.trim() && !hasKey)}>{key.trim() ? 'Salvar e testar' : 'Testar conexão'}</Button>
        </div>
      </div>
    </div>
  );
}
