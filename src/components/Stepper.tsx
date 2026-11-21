import { Paw } from './ui';

const LABELS = ['Qual app', 'Para quê', 'Com o quê', 'Resultado'];

export default function Stepper({ current }: { current: number }) {
  return (
    <ol className="mb-10 flex flex-wrap items-center gap-2 text-lg">
      {LABELS.map((label, i) => (
        <li key={label} className="flex items-center gap-2">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-full border-[3px] font-hand text-lg ${
              i < current
                ? 'border-ink bg-lav text-cream'
                : i === current
                  ? 'border-ink bg-cream text-ink shadow-[0_0_0_3px_var(--color-cream)]'
                  : 'border-line text-muted'
            }`}
          >
            {i < current ? <Paw className="h-5 w-5" /> : i + 1}
          </span>
          <span className={i === current ? 'text-cream' : 'text-muted'}>{label}</span>
          {i < LABELS.length - 1 && <span className="mx-1 h-0.5 w-8 rounded bg-line" />}
        </li>
      ))}
    </ol>
  );
}
