import { APPS, type AppId } from '../../shared/catalog';
import { LIMITS } from '../../shared/config';
import { Button } from './ui';

interface Props {
  app: AppId;
  businessName: string;
  purpose: string;
  onChange: (patch: { businessName?: string; purpose?: string }) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function PurposeStep({ app, businessName, purpose, onChange, onBack, onNext }: Props) {
  const valid = purpose.trim().length >= 10;
  return (
    <section className="max-w-2xl">
      <h1 className="text-2xl font-bold text-white sm:text-3xl">Para que serve o seu {APPS[app].name.toLowerCase()}?</h1>
      <p className="mt-2 text-gray-400">A IA usa isso para criar o nome, o slogan, a cor e o conteúdo inicial.</p>

      <label className="mt-6 block text-sm font-medium text-gray-200" htmlFor="name">
        Nome do negócio <span className="text-gray-500">(opcional — a IA sugere um se ficar vazio)</span>
      </label>
      <input
        id="name"
        value={businessName}
        maxLength={LIMITS.businessName}
        onChange={(e) => onChange({ businessName: e.target.value })}
        className="mt-2 w-full rounded-lg border border-line bg-panel px-3 py-2.5 text-white outline-none focus:border-cyan-400"
      />

      <label className="mt-5 block text-sm font-medium text-gray-200" htmlFor="purpose">
        Descreva o negócio e o público
      </label>
      <textarea
        id="purpose"
        value={purpose}
        maxLength={LIMITS.purpose}
        rows={5}
        placeholder={APPS[app].purposePlaceholder}
        onChange={(e) => onChange({ purpose: e.target.value })}
        className="mt-2 w-full rounded-lg border border-line bg-panel px-3 py-2.5 text-white outline-none focus:border-cyan-400"
      />
      <p className="mt-1 text-right text-xs text-gray-500">
        {purpose.length}/{LIMITS.purpose}
      </p>

      <div className="mt-6 flex gap-3">
        <Button variant="ghost" onClick={onBack}>Voltar</Button>
        <Button onClick={onNext} disabled={!valid}>Continuar</Button>
      </div>
      {!valid && purpose.length > 0 && <p className="mt-2 text-xs text-amber-300">Escreva pelo menos 10 caracteres.</p>}
    </section>
  );
}
