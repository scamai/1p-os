"use client";

import Link from "next/link";

// ── Keywords ──

const KEYWORDS: { term: string; explanation: string }[] = [
  {
    term: "LLC",
    explanation: "Limited Liability Company. Simple to set up, cheap to maintain, pass-through taxation. Great for bootstrapped businesses, consulting, and side projects. Not what VCs want to invest in.",
  },
  {
    term: "C-Corp",
    explanation: "The standard corporate structure for venture-backed startups. Separate tax entity, can issue stock, preferred by investors. More paperwork and higher costs than an LLC, but necessary if you\u2019re raising money.",
  },
  {
    term: "S-Corp",
    explanation: "A tax election, not an entity type. An LLC or C-Corp can elect S-Corp status to reduce self-employment taxes. Useful once you\u2019re paying yourself a salary above ~$40k. Talk to a CPA before doing this.",
  },
  {
    term: "Delaware",
    explanation: "The default state for startup incorporation. Specialized business courts, well-established corporate law, and every VC expects it. You don\u2019t need to live there or operate there.",
  },
  {
    term: "Registered Agent",
    explanation: "A person or company designated to receive legal documents and government notices on behalf of your business. Required in every state you\u2019re registered in. Costs $50\u2013$300/year.",
  },
  {
    term: "EIN",
    explanation: "Employer Identification Number. A Social Security number for your business. Free from the IRS, takes 5 minutes online. You need it to open a bank account, hire people, and file taxes.",
  },
  {
    term: "Bylaws",
    explanation: "The internal rulebook for a C-Corp. Defines how the board operates, how decisions are made, officer roles, and meeting requirements. Not filed with the state \u2014 kept internally.",
  },
  {
    term: "Operating Agreement",
    explanation: "The LLC equivalent of bylaws. Defines ownership percentages, profit distribution, decision-making authority, and what happens if a member leaves. Some states require it. You should have one regardless.",
  },
  {
    term: "Franchise Tax",
    explanation: "An annual tax Delaware charges just for the privilege of being incorporated there. Starts at $400/year for most startups using the Assumed Par Value method. Due March 1st every year. Miss it and your company gets voided.",
  },
  {
    term: "Articles of Incorporation",
    explanation: "The document you file with the state to officially create your corporation. For LLCs, it\u2019s called Articles of Organization. This is the birth certificate of your company.",
  },
];

const MISTAKES = [
  "Choosing an LLC when you know you\u2019re raising VC. You\u2019ll have to convert later, and it\u2019s expensive and messy.",
  "Incorporating in your home state \u201Cbecause it\u2019s easier\u201D when you\u2019re building a venture-scale business. Investors will make you re-incorporate in Delaware anyway.",
  "No operating agreement. Two founders, no written rules, and a disagreement six months in. Good luck.",
  "Waiting until you have revenue to incorporate. By then you\u2019ve been personally liable for everything \u2014 contracts, debts, lawsuits.",
  "Using a business name without checking if it\u2019s trademarked. Getting a cease-and-desist after you\u2019ve printed business cards and built a brand.",
  "Skipping the 83(b) election. You have 30 days from receiving restricted stock. Miss it and you could owe taxes on gains you haven\u2019t realized. There\u2019s no extension, no exception.",
  "Splitting equity without vesting. Your co-founder leaves after two months with 50% of the company. Forever.",
];

// ── Page ──

export default function IncorporationPage() {
  return (
    <article className="mx-auto max-w-[680px] px-6 py-16 md:py-24">
      {/* Title */}
      <header>
        <h1 className="font-heading text-[clamp(2.5rem,6vw,3.5rem)] italic font-extralight leading-[1.1] tracking-[-0.03em] text-black">
          Incorporation
        </h1>
        <div className="mt-8 flex items-center gap-3 text-[13px] text-black/40">
          <span>7 min read</span>
        </div>
      </header>

      {/* Opening — large lede */}
      <p className="mt-14 text-[22px] leading-[1.75] text-black/70 font-light">
        Until you incorporate, there is no company. There&apos;s just you
        &mdash; personally liable for every contract you sign, every debt
        you take on, and every lawsuit that comes your way. Incorporation
        is the line between playing business and being in business.
      </p>

      {/* Sections */}
      <div className="mt-16 space-y-12">
        {/* Why incorporate */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Why you need to incorporate
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            Incorporation isn&apos;t about avoiding responsibility &mdash;{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              it&apos;s about taking it seriously enough to formalize it.
            </span>{" "}
            Without a legal entity, there&apos;s no structure for accountability.
            No clear ownership. No separation between your personal finances
            and your business obligations. No way for partners, customers, or
            investors to hold the company to its commitments.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            A corporation creates a framework of accountability that doesn&apos;t
            exist otherwise. It requires you to track finances separately, file
            taxes, maintain records, and operate transparently. You&apos;re not
            hiding behind a legal entity &mdash;{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              you&apos;re building one that can be held accountable in ways
              an individual operating informally never could.
            </span>
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            It also makes everything else possible: opening a business bank
            account, hiring employees, raising money, issuing equity, signing
            contracts that bind the company rather than you personally. These
            aren&apos;t protections from consequence &mdash; they&apos;re the
            foundations of a real business that can outlast its founders.
          </p>
        </section>

        {/* LLC vs C-Corp */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            LLC vs C-Corp
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            This is the first real decision.{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              An LLC is simpler, cheaper, and perfectly fine for most businesses.
            </span>{" "}
            Pass-through taxation means you don&apos;t get taxed twice. Less
            paperwork. Lower maintenance costs. If you&apos;re building a
            consulting firm, an agency, a SaaS you plan to bootstrap, or a
            side project &mdash; LLC.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            A C-Corp is what you need if you&apos;re raising venture capital.
            Full stop.{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              VCs cannot invest in LLCs.
            </span>{" "}
            The tax structure doesn&apos;t work for their fund model. Every
            YC company, every Series A company, every company that&apos;s ever
            gone public &mdash; C-Corp. If there&apos;s any chance you&apos;ll
            raise outside money, start as a C-Corp. Converting from an LLC
            to a C-Corp later costs $2,000&ndash;$5,000 in legal fees and
            creates a tax headache you don&apos;t want.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            The honest answer for most first-time founders: if you&apos;re not
            sure, start with an LLC. You can always convert later. But if
            you&apos;re building something you want to scale to millions in
            revenue with outside investors, just go C-Corp from day one.
          </p>
        </section>

        {/* Pull quote */}
        <blockquote className="border-l-[3px] border-black pl-8">
          <p className="text-[24px] font-light leading-[1.6] tracking-[-0.01em] text-black/80 italic">
            If there&apos;s any chance you&apos;ll raise venture capital,
            incorporate as a Delaware C-Corp. Everything else is a detour.
          </p>
        </blockquote>

        {/* Why Delaware */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Why Delaware
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            Delaware isn&apos;t a gimmick. There are real reasons most
            startups incorporate there, even if they never set foot in the
            state.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              The Court of Chancery is the big one.
            </span>{" "}
            It&apos;s a dedicated business court with judges &mdash; not
            juries &mdash; who specialize in corporate law. Disputes get
            resolved faster and more predictably. There&apos;s 200+ years
            of case law that makes outcomes less of a coin flip.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            Delaware corporate law is also the most flexible and
            well-understood in the country. Every startup lawyer knows it.
            Every VC term sheet assumes it.{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              Incorporating elsewhere means your investors&apos; lawyers have
              to figure out a different state&apos;s rules, and they won&apos;t
              want to.
            </span>
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            The trade-off is Delaware&apos;s franchise tax. It starts at $400/year
            and can increase as you authorize more shares. It&apos;s due
            March 1st. If you forget to pay it, Delaware will void your
            company. Not suspend &mdash; void. You can reinstate, but it
            costs more and creates legal gaps that make investors nervous.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            If you&apos;re building a local business or a lifestyle company,
            you don&apos;t need Delaware. Incorporate in your home state.
            Wyoming is popular for LLCs &mdash; no state income tax, low fees,
            strong privacy protections.
          </p>
        </section>

        {/* When to incorporate */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            When to incorporate
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            Not on day one of your idea. Not when you&apos;re still figuring
            out if anyone wants what you&apos;re building.{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              Incorporate when you start doing things that create liability.
            </span>
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            That means: signing contracts, accepting money from customers,
            bringing on a co-founder, hiring anyone, or taking investment.
            The moment real money or real obligations are on the table,
            you need the legal protection.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            Don&apos;t wait until you have revenue to &ldquo;justify&rdquo;
            the cost. An LLC costs $89 to file. A lawsuit costs $50,000.
            The math isn&apos;t complicated.
          </p>
        </section>

        {/* The actual steps */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            The actual steps
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            The process is less complicated than people make it sound. Here&apos;s
            what actually happens:
          </p>
          <div className="mt-6 space-y-4">
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              <strong className="text-black/70">Check name availability.</strong>{" "}
              Search your state&apos;s business registry and the USPTO trademark
              database. Finding out your name is taken after you&apos;ve built a
              brand around it is a special kind of pain.
            </p>
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              <strong className="text-black/70">Get a registered agent.</strong>{" "}
              Every state requires one. This is a person or service that
              receives legal documents on behalf of your company. You can be
              your own, but using a service ($50&ndash;$150/year) keeps your
              home address off public records.
            </p>
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              <strong className="text-black/70">File your formation documents.</strong>{" "}
              Articles of Incorporation for a C-Corp, Articles of Organization
              for an LLC. File with the Secretary of State. Most states let you
              do this online in 15 minutes.
            </p>
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              <strong className="text-black/70">Get your EIN.</strong>{" "}
              Apply on the IRS website. It&apos;s free and takes 5 minutes.
              You&apos;ll get your number immediately. You need this before you
              can open a bank account or hire anyone.
            </p>
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              <strong className="text-black/70">Open a business bank account.</strong>{" "}
              Bring your EIN, formation documents, and ID. Mercury and Brex are
              popular with startups. Traditional banks work too. The point is to
              separate personal and business money from day one.
            </p>
          </div>
        </section>

        {/* Registered agents */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Registered agents
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            A registered agent is the official point of contact between your
            company and the state. They receive tax notices, legal summons,
            and compliance documents. Every state requires you to have one
            with a physical address in that state.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              You can be your own registered agent, but you probably
              shouldn&apos;t.
            </span>{" "}
            Your address goes on public record. You need to be available
            during business hours to accept documents in person. And if
            you ever get sued, a process server shows up at that address.
            For $50&ndash;$150 a year, a registered agent service handles
            all of it and forwards everything to you digitally.
          </p>
        </section>

        {/* Operating agreements and bylaws */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Operating agreements and bylaws
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            Your formation documents create the company. Your operating
            agreement (LLC) or bylaws (C-Corp) define how it runs.{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              Without these, your state&apos;s default rules apply &mdash;
              and those defaults probably aren&apos;t what you want.
            </span>
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            An operating agreement covers: who owns what percentage, how
            profits are distributed, how decisions get made, what happens
            when someone wants to leave, and how to dissolve the company.
            Even if you&apos;re a single-member LLC, get one. It reinforces
            the separation between you and the business &mdash; which is
            the whole point of incorporating.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            Bylaws cover: board structure, officer roles, meeting
            requirements, stock issuance rules, and amendment procedures.
            Your first investor will ask to see them. Templates are fine
            for early stage &mdash; you don&apos;t need a $5,000 lawyer
            for this on day one.
          </p>
        </section>

        {/* Common mistakes */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Mistakes that cost real money
          </h2>
          <div className="mt-6 space-y-4">
            {MISTAKES.map((m, i) => (
              <p key={i} className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
                {m}
              </p>
            ))}
          </div>
        </section>

        {/* Pull quote */}
        <blockquote className="border-l-[3px] border-black pl-8">
          <p className="text-[24px] font-light leading-[1.6] tracking-[-0.01em] text-black/80 italic">
            The cheapest time to incorporate is before something
            goes wrong. The most expensive time is after.
          </p>
        </blockquote>

        {/* Cost breakdown */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            What it actually costs
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            Incorporation doesn&apos;t have to be expensive. Here&apos;s
            the real breakdown:
          </p>
          <div className="mt-6 space-y-4">
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              <strong className="text-black/70">DIY filing: $89&ndash;$300.</strong>{" "}
              State filing fees only. You fill out the forms yourself, file
              online with the Secretary of State, and get your own EIN. This
              is all you need for a simple LLC. Delaware filing fee is $89
              for an LLC, $89 for a C-Corp plus $50 minimum franchise tax.
            </p>
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              <strong className="text-black/70">Formation service: $150&ndash;$400.</strong>{" "}
              Services like Northwest, ZenBusiness, or Incfile handle the
              filing for you and include a registered agent. Worth it if
              paperwork makes you anxious. Avoid the upsells &mdash; you
              don&apos;t need the $300 &ldquo;premium package.&rdquo;
            </p>
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              <strong className="text-black/70">Stripe Atlas: $500.</strong>{" "}
              One fee, everything handled. Delaware C-Corp formation, EIN,
              bank account with Mercury or SVB, stock issuance, 83(b) election
              template, and post-incorporation documents. If you&apos;re
              building a tech startup and want to get it right without
              thinking about it, this is the move.
            </p>
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              <strong className="text-black/70">Startup lawyer: $1,500&ndash;$5,000.</strong>{" "}
              For complex situations &mdash; multiple founders with
              different contributions, unusual equity arrangements, or
              if you&apos;re about to raise money. Many startup lawyers
              offer deferred payment or work for equity at the earliest
              stages.
            </p>
          </div>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              Don&apos;t let cost be the reason you skip incorporation.
            </span>{" "}
            An LLC filing fee is less than a month of coffee. The
            liability protection alone is worth ten times that.
          </p>
        </section>
      </div>

      {/* Separator — three dots */}
      <div className="my-20 flex justify-center gap-1.5">
        <span className="h-[3px] w-[3px] bg-black/25" />
        <span className="h-[3px] w-[3px] bg-black/25" />
        <span className="h-[3px] w-[3px] bg-black/25" />
      </div>

      {/* Keywords */}
      <h2 className="text-[13px] font-medium uppercase tracking-[0.15em] text-black/30">
        Words you need to know
      </h2>

      <div className="mt-8 space-y-8">
        {KEYWORDS.map((k, i) => (
          <div key={i}>
            <p className="text-[20px] font-medium leading-[1.4] text-black">{k.term}</p>
            <p className="mt-2 text-[17px] leading-[1.9] text-black/50">
              {k.explanation}
            </p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-16 pb-8 flex flex-col sm:flex-row gap-3">
        <Link
          href="/business/traction"
          className="inline-flex items-center gap-2.5 border border-black bg-black px-6 py-3.5 text-[15px] font-medium text-white transition-colors hover:bg-black/90"
        >
          Next: Traction
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
        <Link
          href="/legal/contracts"
          className="inline-flex items-center gap-2.5 border border-black/[0.15] px-6 py-3.5 text-[15px] font-medium text-black transition-colors hover:bg-black/[0.03]"
        >
          Open Legal Templates
        </Link>
      </div>
    </article>
  );
}
