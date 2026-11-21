import { ArrowRight, Newspaper, Plane, ShoppingBag } from 'lucide-react';
import { APP_LIST, type AppId } from '../../shared/catalog';

const ICONS: Record<AppId, typeof Plane> = { store: ShoppingBag, blog: Newspaper, travel: Plane };

export default function AppStep({ selected, onSelect }: { selected?: AppId; onSelect: (id: AppId) => void }) {
  return (
    <section>
      <div className="relative grid items-end gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <div className="pb-4">
          <img src="/gato/title.webp" alt="Gato Pingado" className="w-full max-w-[460px] -rotate-6" />
          <p className="gp-title mt-4 ml-6 max-w-[26ch] -rotate-3 text-2xl sm:text-3xl">
            Escolha o app, conte para que ele serve e receba o projeto pronto para rodar.
          </p>
          <p className="mt-6 text-lg text-cream-2">Todos saem full-stack: site Next.js, banco e backend Convex, login com Clerk.</p>
        </div>
        <img src="/gato/cat-hero.webp" alt="" aria-hidden="true" className="mx-auto hidden w-full max-w-[420px] md:block" />
      </div>

      <div className="relative mt-2 grid gap-5 md:grid-cols-3">
        {APP_LIST.map((app) => {
          const Icon = ICONS[app.id];
          const active = selected === app.id;
          return (
            <button
              key={app.id}
              onClick={() => onSelect(app.id)}
              className={`gp-frame group text-left transition hover:-translate-y-1 ${active ? 'ring-4 ring-lav-soft' : ''}`}
            >
              <div className="gp-card flex h-full flex-col p-5">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border-[3px] border-ink bg-lav text-cream">
                  <Icon className="h-6 w-6" />
                </span>
                <h2 className="gp-title mt-4 text-3xl">{app.name}</h2>
                <p className="mt-1 text-lg leading-tight">{app.tagline}</p>
                <p className="mt-3 flex-1 text-base leading-snug text-[#3b3740]">{app.description}</p>
                <div className="mt-4 flex items-end justify-between gap-3">
                  <p className="text-sm text-[#5a5560]">{app.stack.join(' · ')}</p>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-cream transition group-hover:-rotate-12 group-hover:scale-110">
                    <ArrowRight className="h-5 w-5" strokeWidth={2.8} />
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
