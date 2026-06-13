import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import tileLibrary from "@/assets/tile-library.jpg";
import tileMarble from "@/assets/tile-marble.jpg";
import tileDesk from "@/assets/tile-desk.jpg";
import tileCorridor from "@/assets/tile-corridor.jpg";
import tileBlueprint from "@/assets/tile-blueprint.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lucid AG — AI-driven Systems Strategists for high-net-worth ecosystems" },
      {
        name: "description",
        content:
          "Lucid AG designs and integrates sovereign AI operating systems for family offices, principals and private holdings. Discreet, technically uncompromising.",
      },
    ],
  }),
  component: Index,
});

type Capability = {
  index: string;
  title: string;
  caption: string;
  image: string;
};

const capabilities: Capability[] = [
  {
    index: "01 / Strategy",
    title: "Systems Strategy",
    caption:
      "Architectural roadmaps for the operating system of a family enterprise. We translate principal intent into intelligent infrastructure.",
    image: tileBlueprint,
  },
  {
    index: "02 / Integration",
    title: "Private AI Integration",
    caption:
      "Sovereign language models and autonomous agents, deployed inside the boundary of the family — never outside it.",
    image: tileMarble,
  },
  {
    index: "03 / Operations",
    title: "Operations Intelligence",
    caption:
      "Continuous synthesis across portfolio companies, investments, staff and assets. One quiet signal in place of many.",
    image: tileDesk,
  },
  {
    index: "04 / Continuity",
    title: "Governance & Continuity",
    caption:
      "Provenance, controls and succession-grade documentation for systems built to outlast the engagement.",
    image: tileCorridor,
  },
  {
    index: "05 / Staff",
    title: "Augmented Principal Staff",
    caption:
      "Tooling, training and protocols so chiefs of staff, family-office teams and personal staff operate with AI as second nature.",
    image: tileLibrary,
  },
];

const ecosystems = [
  {
    label: "Single-family offices",
    body:
      "We work alongside the CEO, CIO and chief of staff to consolidate operating intelligence across investments, holdings and household.",
  },
  {
    label: "Principals & founders",
    body:
      "Private engagements with the principal directly — personal intelligence systems, decision support, and discreet automation.",
  },
  {
    label: "Private holdings",
    body:
      "Operator-grade AI inside portfolio companies, with reporting lines back to the family rather than to a public board.",
  },
  {
    label: "Trusted advisors",
    body:
      "Embedded work with the family's lawyers, bankers and accountants — we sit on their side of the table, not the vendor's.",
  },
];

const philosophy = [
  {
    n: "I.",
    title: "Discretion is the product.",
    body:
      "Our work is most successful when it is invisible. We do not publish case studies, logos or named references.",
  },
  {
    n: "II.",
    title: "Sovereign by default.",
    body:
      "Models, weights, prompts and data remain inside the family's perimeter. No vendor lock-in. No data exhaust.",
  },
  {
    n: "III.",
    title: "Strategists, not implementers.",
    body:
      "We design the system, build the spine, and hand operating authority back to the family's own people.",
  },
  {
    n: "IV.",
    title: "One engagement at a time.",
    body:
      "Capacity is deliberately limited. We work with a small number of ecosystems where we can move with conviction.",
  },
];

function Index() {
  // Cursor-following accent dot — quiet interactivity
  const [coords, setCoords] = useState({ x: -100, y: -100 });
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => setCoords({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div className="bg-cream text-ink font-body min-h-screen">
      {/* Cursor accent */}
      <div
        aria-hidden
        className="pointer-events-none fixed z-50 size-2 rounded-full bg-ink mix-blend-multiply transition-transform duration-300 ease-out hidden md:block"
        style={{
          transform: `translate3d(${coords.x - 4}px, ${coords.y - 4}px, 0) scale(${
            hoverIdx !== null ? 6 : 1
          })`,
          opacity: hoverIdx !== null ? 0.15 : 0.85,
        }}
      />

      {/* Top bar */}
      <header className="fixed top-0 inset-x-0 z-40 bg-cream/85 backdrop-blur-md">
        <div className="mx-auto max-w-[1600px] px-6 md:px-10 h-16 flex items-center justify-between">
          <a href="#top" className="flex items-baseline gap-2">
            <span className="font-display text-2xl leading-none tracking-tight">Lucid</span>
            <span className="eyebrow">AG</span>
          </a>
          <nav className="hidden md:flex items-center gap-10">
            <a href="#practice" className="link-rule text-sm text-ink/80 hover:text-ink">Practice</a>
            <a href="#capabilities" className="link-rule text-sm text-ink/80 hover:text-ink">Capabilities</a>
            <a href="#ecosystems" className="link-rule text-sm text-ink/80 hover:text-ink">Ecosystems</a>
            <a href="#philosophy" className="link-rule text-sm text-ink/80 hover:text-ink">Philosophy</a>
          </nav>
          <a
            href="#inquire"
            className="text-sm font-medium border border-ink/30 px-4 py-2 hover:bg-ink hover:text-cream transition-colors"
          >
            Private inquiry
          </a>
        </div>
      </header>

      <main id="top">
        {/* Hero — oversized wordmark */}
        <section
          ref={heroRef}
          className="relative pt-32 pb-12 md:pt-44 md:pb-20 px-6 md:px-10 overflow-hidden"
        >
          <div className="mx-auto max-w-[1600px]">
            <div className="flex items-start justify-between mb-12 md:mb-24">
              <div className="eyebrow rise-in">Est. — Operating now in Zürich · London · Singapore</div>
              <div className="eyebrow hidden md:block rise-in" style={{ animationDelay: "120ms" }}>
                Index — N°&nbsp;001 / Systems
              </div>
            </div>

            <h1
              className="wordmark text-[18vw] md:text-[16vw] leading-[0.82] -tracking-[0.05em] select-none rise-in"
              style={{ animationDelay: "200ms" }}
            >
              Lucid<span className="text-steel">.</span>
            </h1>

            <div className="mt-12 md:mt-20 grid grid-cols-1 md:grid-cols-12 gap-10">
              <p className="md:col-span-7 md:col-start-2 font-display text-3xl md:text-5xl leading-[1.05] -tracking-[0.01em] text-ink rise-in" style={{ animationDelay: "320ms" }}>
                <span className="italic text-ink/55">We are</span> AI-driven systems strategists
                <span className="italic text-ink/55"> for</span> high-net-worth ecosystems.
              </p>
              <div className="md:col-span-3 md:col-start-10 self-end space-y-4 rise-in" style={{ animationDelay: "440ms" }}>
                <p className="text-sm leading-relaxed text-ink/70">
                  Lucid AG builds the private operating intelligence behind family offices, principals and the
                  businesses they own — quietly, durably, and on their own terms.
                </p>
                <a href="#capabilities" className="eyebrow link-rule inline-block">↓ &nbsp; Scroll to capabilities</a>
              </div>
            </div>
          </div>
        </section>

        {/* Marquee */}
        <section aria-hidden className="border-y border-rule overflow-hidden py-6 my-12">
          <div className="flex whitespace-nowrap marquee-track gap-16">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-16 shrink-0 font-display text-3xl md:text-4xl italic text-ink/80">
                <span>Sovereign intelligence.</span>
                <span className="text-steel">✦</span>
                <span>Family-office grade.</span>
                <span className="text-steel">✦</span>
                <span>Built to outlast us.</span>
                <span className="text-steel">✦</span>
                <span>Quiet by design.</span>
                <span className="text-steel">✦</span>
              </div>
            ))}
          </div>
        </section>

        {/* Practice */}
        <section id="practice" className="px-6 md:px-10 py-20 md:py-32">
          <div className="mx-auto max-w-[1600px] grid grid-cols-1 md:grid-cols-12 gap-10">
            <div className="md:col-span-3">
              <div className="eyebrow">§ 01 — Practice</div>
            </div>
            <div className="md:col-span-8 md:col-start-5">
              <p className="font-display text-2xl md:text-4xl leading-[1.2]">
                For a generation, family offices ran on relationships, judgment and a handful of trusted
                advisors. The next generation will also run on{" "}
                <span className="italic text-steel">private operating intelligence</span> —
                models, agents and systems that compound an ecosystem's advantage without ever leaving it.
              </p>
              <p className="mt-8 text-base md:text-lg text-ink/70 max-w-2xl leading-relaxed">
                Lucid AG exists to design and install that layer. We do not sell software. We do not resell other
                people's models. We embed inside the principal's world and build the intelligence the family will
                actually operate.
              </p>
            </div>
          </div>
        </section>

        {/* Capabilities — horizontal-scroll strip */}
        <section id="capabilities" className="py-12 md:py-20">
          <div className="mx-auto max-w-[1600px] px-6 md:px-10 flex items-end justify-between mb-10">
            <div>
              <div className="eyebrow mb-3">§ 02 — Capabilities</div>
              <h2 className="font-display text-4xl md:text-6xl leading-[0.95] -tracking-[0.02em]">
                Five disciplines, <span className="italic text-steel">one system.</span>
              </h2>
            </div>
            <div className="eyebrow hidden md:block">↔ &nbsp; Scroll horizontally</div>
          </div>

          <div className="strip-scroll overflow-x-auto pb-10">
            <ul className="flex gap-6 px-6 md:px-10 w-max">
              {capabilities.map((c, i) => (
                <li
                  key={c.title}
                  className="group relative w-[78vw] sm:w-[44vw] md:w-[32vw] lg:w-[26vw] shrink-0 scroll-ml-10 snap-start"
                  onMouseEnter={() => setHoverIdx(i)}
                  onMouseLeave={() => setHoverIdx(null)}
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-cream-deep">
                    <img
                      src={c.image}
                      alt=""
                      loading="lazy"
                      width={1024}
                      height={1280}
                      className="size-full object-cover transition-all duration-[1200ms] ease-out grayscale-[40%] group-hover:grayscale-0 group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-ink/20 group-hover:bg-ink/0 transition-colors duration-700" />
                    <div className="absolute top-4 left-4 eyebrow text-cream/90">{c.index}</div>
                  </div>
                  <div className="pt-5 flex items-start justify-between gap-6">
                    <h3 className="font-display text-2xl md:text-3xl leading-tight -tracking-[0.01em]">
                      {c.title}
                    </h3>
                    <span className="eyebrow shrink-0 mt-2">↗</span>
                  </div>
                  <p className="mt-3 text-sm text-ink/65 leading-relaxed max-w-[36ch]">{c.caption}</p>
                </li>
              ))}
              <li className="w-6 shrink-0" aria-hidden />
            </ul>
          </div>
        </section>

        {/* Ecosystems */}
        <section id="ecosystems" className="px-6 md:px-10 py-20 md:py-32 bg-cream-deep">
          <div className="mx-auto max-w-[1600px] grid grid-cols-1 md:grid-cols-12 gap-10">
            <div className="md:col-span-4">
              <div className="eyebrow mb-3">§ 03 — Ecosystems</div>
              <h2 className="font-display text-4xl md:text-6xl leading-[0.95] -tracking-[0.02em]">
                Who we work <span className="italic text-steel">with.</span>
              </h2>
              <p className="mt-6 text-sm text-ink/65 max-w-sm leading-relaxed">
                We work with a small number of private ecosystems — by referral, under strict confidence,
                and with the principal in the room.
              </p>
            </div>
            <ul className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-px bg-rule self-start">
              {ecosystems.map((e) => (
                <li key={e.label} className="bg-cream-deep p-8 md:p-10 hover:bg-cream transition-colors duration-500">
                  <div className="eyebrow mb-6">— {e.label}</div>
                  <p className="font-display text-xl md:text-2xl leading-snug">{e.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Philosophy — large numerals */}
        <section id="philosophy" className="px-6 md:px-10 py-24 md:py-40">
          <div className="mx-auto max-w-[1600px]">
            <div className="eyebrow mb-4">§ 04 — Philosophy</div>
            <h2 className="font-display text-5xl md:text-8xl leading-[0.92] -tracking-[0.03em] max-w-[18ch]">
              A practice of <span className="italic text-steel">restraint.</span>
            </h2>

            <ol className="mt-16 md:mt-24 space-y-px bg-rule">
              {philosophy.map((p) => (
                <li
                  key={p.n}
                  className="grid grid-cols-12 gap-6 bg-cream py-8 md:py-12 hover:bg-cream-deep transition-colors duration-500"
                >
                  <div className="col-span-2 md:col-span-2 font-display text-3xl md:text-5xl text-steel">{p.n}</div>
                  <h3 className="col-span-10 md:col-span-4 font-display text-2xl md:text-4xl leading-tight -tracking-[0.01em]">
                    {p.title}
                  </h3>
                  <p className="col-span-12 md:col-span-5 md:col-start-8 text-base md:text-lg text-ink/70 leading-relaxed">
                    {p.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Inquire */}
        <section id="inquire" className="bg-ink text-cream px-6 md:px-10 py-24 md:py-36">
          <div className="mx-auto max-w-[1600px] grid grid-cols-1 md:grid-cols-12 gap-10">
            <div className="md:col-span-7">
              <div className="eyebrow text-cream/60 mb-6">§ 05 — Inquiry</div>
              <h2 className="font-display text-5xl md:text-8xl leading-[0.9] -tracking-[0.03em]">
                Speak with us <span className="italic text-steel/90">privately.</span>
              </h2>
              <p className="mt-8 text-base md:text-lg text-cream/70 max-w-xl leading-relaxed">
                New engagements begin with a confidential conversation — typically with the principal,
                the CEO of the family office, or the chief of staff. We sign an NDA before the first
                meeting if that is preferred.
              </p>
            </div>
            <div className="md:col-span-4 md:col-start-9 self-end space-y-8">
              <div>
                <div className="eyebrow text-cream/50 mb-2">Direct</div>
                <a href="mailto:office@lucidag.com" className="font-display text-2xl md:text-3xl link-rule">
                  office@lucidag.com
                </a>
              </div>
              <div>
                <div className="eyebrow text-cream/50 mb-2">Offices</div>
                <p className="text-cream/80">Zürich &middot; London &middot; Singapore</p>
              </div>
              <a
                href="mailto:office@lucidag.com"
                className="inline-flex items-center gap-3 border border-cream/30 px-6 py-4 text-sm font-medium hover:bg-cream hover:text-ink transition-colors"
              >
                Request a private consultation
                <span aria-hidden>→</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="px-6 md:px-10 py-10 border-t border-rule">
        <div className="mx-auto max-w-[1600px] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="eyebrow">© {new Date().getFullYear()} Lucid AG — All matters confidential</div>
          <div className="flex gap-8 eyebrow">
            <a href="#" className="hover:text-ink">Privacy</a>
            <a href="#" className="hover:text-ink">Notice</a>
            <a href="#inquire" className="hover:text-ink">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
