import { Plane, ShoppingBag, Newspaper } from 'lucide-react';
import { APP_LIST, type AppId } from '../../shared/catalog';

const ICONS: Record<AppId, typeof Plane> = { store: ShoppingBag, blog: Newspaper, travel: Plane };

export default function AppStep({ selected, onSelect }: { selected?: AppId; onSelect: (id: AppId) => void }) {
  return (
    <section>
      <h1 className="text-2xl font-bold text-white sm:text-3xl">Qual app você quer?</h1>
      <p className="mt-2 text-gray-400">Todos saem full-stack: site Next.js, banco e backend Convex, login com Clerk.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {APP_LIST.map((app) => {
          const Icon = ICONS[app.id];
          const active = selected === app.id;
          return (
            <button
              key={app.id}
              onClick={() => onSelect(app.id)}
              className={`flex h-full flex-col rounded-xl border p-5 text-left transition ${
                active ? 'border-cyan-400 bg-cyan-950/30' : 'border-line bg-panel hover:border-gray-600'
              }`}
            >
              <Icon className="h-6 w-6 text-cyan-300" />
              <h2 className="mt-3 text-lg font-semibold text-white">{app.name}</h2>
              <p className="mt-1 text-sm text-gray-300">{app.tagline}</p>
              <p className="mt-3 flex-1 text-xs text-gray-500">{app.description}</p>
              <p className="mt-4 text-xs text-gray-400">{app.stack.join(' · ')}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
