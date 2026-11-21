const LABELS = ['Qual app', 'Para quê', 'Com o quê', 'Resultado'];

export default function Stepper({ current }: { current: number }) {
  return (
    <ol className="mb-8 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
      {LABELS.map((label, i) => (
        <li key={label} className="flex items-center gap-2">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
              i < current ? 'bg-cyan-400 text-black' : i === current ? 'border-2 border-cyan-400 text-cyan-300' : 'border border-gray-700 text-gray-500'
            }`}
          >
            {i + 1}
          </span>
          <span className={i === current ? 'font-semibold text-white' : 'text-gray-500'}>{label}</span>
          {i < LABELS.length - 1 && <span className="mx-1 h-px w-6 bg-gray-700" />}
        </li>
      ))}
    </ol>
  );
}
