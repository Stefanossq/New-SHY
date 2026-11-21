import { APPS, type AppId } from '../../shared/catalog';
import { LIMITS } from '../../shared/config';
import { Button, ScreenTitle } from './ui';

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
      <ScreenTitle sub={`${APPS[app].name}: a IA usa isso para criar o nome, as cores, os textos e o conteúdo inicial.`}>
        Para que serve o app?
      </ScreenTitle>

      <label className="mt-8 block text-xl" htmlFor="name">
        Nome do negócio <span className="text-muted">(opcional — a IA sugere um se ficar vazio)</span>
      </label>
      <input
        id="name"
        value={businessName}
        maxLength={LIMITS.businessName}
        onChange={(e) => onChange({ businessName: e.target.value })}
        className="gp-input mt-2"
      />

      <label className="mt-6 block text-xl" htmlFor="purpose">
        Descreva o negócio e o público
      </label>
      <textarea
        id="purpose"
        value={purpose}
        maxLength={LIMITS.purpose}
        rows={5}
        placeholder={APPS[app].purposePlaceholder}
        onChange={(e) => onChange({ purpose: e.target.value })}
        className="gp-input mt-2"
      />
      <p className="mt-1 text-right text-base text-muted">
        {purpose.length}/{LIMITS.purpose}
      </p>

      <div className="mt-6 flex flex-wrap gap-4">
        <Button variant="ghost" onClick={onBack}>Voltar</Button>
        <Button onClick={onNext} disabled={!valid}>Continuar</Button>
      </div>
      {!valid && purpose.length > 0 && <p className="mt-3 text-lg text-warn">Escreva pelo menos 10 caracteres.</p>}
    </section>
  );
}
