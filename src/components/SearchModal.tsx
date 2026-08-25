import { useEffect, useRef, useState } from "react";

export interface NavItem {
  to: string;
  label: string;
}

export interface RecentPost {
  slug: string;
  title: string;
}

interface SearchModalProps {
  nav: NavItem[];
  recent: RecentPost[];
}

interface PagefindData {
  url: string;
  meta: { title?: string };
  excerpt: string;
}

interface Hit {
  key: string;
  label: string;
  url: string;
  excerpt?: string;
}

const MAX_RESULTS = 8;

// Assigned to a variable so Vite cannot statically resolve this URL — the
// file only exists in the built site, produced by Pagefind after astro build.
const pagefindPath = "/pagefind/pagefind.js";

/**
 * Full-text search modal backed by Pagefind. The index lives at
 * /pagefind/ and is produced by `pagefind --site dist` during build,
 * so in `astro dev` it shows a hint until the site has been built once.
 *
 * Open triggers: ⌘K / Ctrl K, or the header button's `quiet:search` event.
 * Matches arrive pre-wrapped in <mark> by Pagefind; styling lives in
 * styles.css under `.search-modal`.
 */
export default function SearchModal({ nav, recent }: SearchModalProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [total, setTotal] = useState(0);
  const [active, setActive] = useState(0);
  const [indexState, setIndexState] = useState<"idle" | "loading" | "ready" | "missing">("idle");
  const pagefind = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Pagefind's browser API ships as a plain script in /pagefind/, not an
  // npm module, so it must be imported by URL at runtime.
  const loadIndex = async () => {
    if (pagefind.current) return;
    setIndexState("loading");
    try {
      // @ts-expect-error runtime URL import, no types exist
      const pf = await import(/* @vite-ignore */ pagefindPath);
      await pf.options({ excerptLength: 22 });
      pagefind.current = pf;
      setIndexState("ready");
    } catch {
      setIndexState("missing");
    }
  };

  useEffect(() => {
    const toggle = () => setOpen((o) => !o);
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        toggle();
      }
    };
    document.addEventListener("quiet:search", toggle);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("quiet:search", toggle);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setHits([]);
      setActive(0);
      return;
    }
    loadIndex();
    document.body.style.overflow = "hidden";
    // Focus after the panel paints
    requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const pf = pagefind.current;
    const term = query.trim();
    if (!pf || !term) {
      setHits([]);
      setTotal(0);
      setActive(0);
      return;
    }

    let cancelled = false;
    // debouncedSearch resolves null when a newer query superseded this one
    pf.debouncedSearch(term, {}, 150).then(async (result: any) => {
      if (!result || cancelled) return;
      const data: PagefindData[] = await Promise.all(
        result.results.slice(0, MAX_RESULTS).map((r: any) => r.data()),
      );
      if (cancelled) return;
      setHits(
        data.map((d) => ({
          key: d.url,
          label: d.meta.title || d.url,
          url: d.url,
          excerpt: d.excerpt,
        })),
      );
      setTotal(result.results.length);
      setActive(0);
    });
    return () => {
      cancelled = true;
    };
  }, [query, indexState]);

  // Idle state offers quick navigation so the palette still replaces kbar
  const idleHits: Hit[] = [
    ...nav.map((item) => ({ key: `nav:${item.to}`, label: item.label, url: item.to })),
    ...recent.map((post) => ({
      key: `recent:${post.slug}`,
      label: post.title,
      url: `/blog/${post.slug}`,
    })),
  ];
  const showing = query.trim() ? hits : idleHits;

  const go = (url: string) => {
    setOpen(false);
    window.location.pathname = url;
  };

  const onInputKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      setOpen(false);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((a) => Math.min(a + 1, showing.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (event.key === "Enter" && showing[active]) {
      go(showing[active].url);
    }
  };

  // Keep the keyboard-highlighted row in view
  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  const searching = query.trim().length > 0;

  return (
    <div
      className="search-modal fixed inset-0 z-50 bg-background/70 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="flex min-h-full items-start justify-center px-4 pt-[12vh]">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Search"
          className="search-modal-panel w-full max-w-xl overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl"
        >
          <div className="flex items-center gap-3 border-b border-border px-4">
            <svg
              className="h-4 w-4 shrink-0 text-muted-foreground"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="Search essays, field notes, and pages"
              aria-label="Search"
              className="w-full bg-transparent py-3.5 font-serif text-lg outline-none placeholder:text-muted-foreground"
            />
            <kbd className="hidden shrink-0 rounded border border-border px-1.5 py-0.5 text-[0.625rem] text-muted-foreground sm:block">
              esc
            </kbd>
          </div>

          <div ref={listRef} className="max-h-[26rem] overflow-y-auto px-2 py-2">
            {indexState === "missing" && (
              <p className="px-3 py-6 text-sm text-muted-foreground">
                No search index yet — run <code>npm run build</code> once, then search works in
                preview and production.
              </p>
            )}

            {!searching && indexState !== "missing" && (
              <>
                <p className="px-3 pt-2 pb-1.5 text-[0.6875rem] font-semibold tracking-widest uppercase text-muted-foreground">
                  Pages
                </p>
                {idleHits.slice(0, nav.length).map((hit, i) => (
                  <Row key={hit.key} hit={hit} active={active === i} index={i} onPick={go} onHover={setActive} />
                ))}
                {recent.length > 0 && (
                  <>
                    <p className="px-3 pt-4 pb-1.5 text-[0.6875rem] font-semibold tracking-widest uppercase text-muted-foreground">
                      Recent writing
                    </p>
                    {idleHits.slice(nav.length).map((hit, i) => (
                      <Row
                        key={hit.key}
                        hit={hit}
                        active={active === nav.length + i}
                        index={nav.length + i}
                        onPick={go}
                        onHover={setActive}
                      />
                    ))}
                  </>
                )}
              </>
            )}

            {searching && indexState === "ready" && hits.length === 0 && (
              <p className="px-3 py-6 text-sm text-muted-foreground">
                Nothing found for “{query.trim()}”.
              </p>
            )}

            {searching && hits.length > 0 && (
              <>
                <p className="px-3 pt-2 pb-1.5 text-[0.6875rem] font-semibold tracking-widest uppercase text-muted-foreground">
                  {total} {total === 1 ? "result" : "results"}
                </p>
                {hits.map((hit, i) => (
                  <Row key={hit.key} hit={hit} active={active === i} index={i} onPick={go} onHover={setActive} />
                ))}
              </>
            )}
          </div>

          <div className="flex items-center gap-4 border-t border-border px-4 py-2 text-[0.6875rem] text-muted-foreground">
            <span>
              <kbd className="rounded border border-border px-1">↑↓</kbd> move
            </span>
            <span>
              <kbd className="rounded border border-border px-1">↵</kbd> open
            </span>
            <span>
              <kbd className="rounded border border-border px-1">esc</kbd> close
            </span>
            <span className="ml-auto">Full-text search by Pagefind</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  hit,
  active,
  index,
  onPick,
  onHover,
}: {
  hit: Hit;
  active: boolean;
  index: number;
  onPick: (url: string) => void;
  onHover: (index: number) => void;
}) {
  return (
    <button
      type="button"
      data-index={index}
      onMouseEnter={() => onHover(index)}
      onClick={() => onPick(hit.url)}
      className={`flex w-full cursor-pointer flex-col gap-0.5 rounded-md px-3 py-2.5 text-left ${
        active ? "bg-muted text-foreground" : "text-foreground"
      }`}
    >
      <span className="text-sm font-medium">{hit.label}</span>
      {hit.excerpt && (
        <span
          className="line-clamp-2 text-xs text-muted-foreground"
          // Pagefind escapes page content before wrapping matches in <mark>
          dangerouslySetInnerHTML={{ __html: hit.excerpt }}
        />
      )}
    </button>
  );
}
