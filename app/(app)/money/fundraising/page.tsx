"use client";

import Link from "next/link";

// ── Keywords ──

const KEYWORDS: { term: string; explanation: string }[] = [
  {
    term: "SAFE",
    explanation: "Simple Agreement for Future Equity. You give an investor money now, and they get shares later — usually when you raise a priced round. No interest, no maturity date. Invented by Y Combinator to make early-stage fundraising less painful. It worked, but it also made it too easy to raise money you don\u2019t need.",
  },
  {
    term: "Priced Round",
    explanation: "A fundraise where you actually set a share price and issue stock. More expensive to set up (lawyers, board seats, paperwork), but cleaner. This is what Series A and beyond typically look like.",
  },
  {
    term: "Pre-money Valuation",
    explanation: "What your company is worth before the new money comes in. If your pre-money is $8M and you raise $2M, investors own 20% of a $10M company. The number is mostly made up at the early stage — it\u2019s a negotiation, not an appraisal.",
  },
  {
    term: "Post-money Valuation",
    explanation: "Pre-money plus the money raised. A $10M post-money SAFE means an investor putting in $1M gets exactly 10%, regardless of how much other money you raise on the same terms. Post-money SAFEs are now the standard.",
  },
  {
    term: "Dilution",
    explanation: "The reduction in your ownership percentage when new shares are created. Every time you raise money, create an option pool, or convert SAFEs, your slice of the pie gets smaller. The pie should be getting bigger — but that\u2019s not guaranteed.",
  },
  {
    term: "Term Sheet",
    explanation: "A non-binding document outlining the key terms of an investment. It covers valuation, board seats, liquidation preferences, and protective provisions. Getting a term sheet feels like winning. Reading it carefully feels less fun.",
  },
  {
    term: "Lead Investor",
    explanation: "The investor who sets the terms, writes the biggest check, and does the most diligence. Everyone else follows their lead. Without a lead, your round doesn\u2019t come together. Finding the lead is 90% of the work.",
  },
  {
    term: "Pro Rata",
    explanation: "The right for an existing investor to maintain their ownership percentage in future rounds by investing more. Investors fight for this. It\u2019s a good sign — it means they want to double down.",
  },
  {
    term: "Convertible Note",
    explanation: "Like a SAFE, but it\u2019s actually debt. It has an interest rate and a maturity date. If you don\u2019t raise a priced round before the note matures, the investor can demand their money back. SAFEs replaced these for good reason.",
  },
  {
    term: "Cap",
    explanation: "The maximum valuation at which a SAFE or convertible note converts into equity. If the cap is $10M and you raise at $20M, the early investor converts at $10M — getting twice as many shares per dollar. It\u2019s the investor\u2019s reward for taking the early risk.",
  },
  {
    term: "Discount",
    explanation: "A percentage discount on the share price that early investors get when the SAFE converts. A 20% discount means they pay 80 cents for shares that new investors pay a dollar for. Usually paired with a cap — the investor gets whichever is more favorable.",
  },
];

const MISTAKES = [
  "Raising money because other founders are raising money. Fundraising is not a milestone. It\u2019s a financing decision.",
  "Optimizing for the highest valuation. A $20M cap sounds better than $10M until you can\u2019t grow into it, and your next round is a down round.",
  "Stacking SAFEs without tracking dilution. Five SAFEs at different caps with different discounts, and suddenly you own 40% of your company before Series A.",
  "Talking to 10 investors and calling it a process. You need 80\u2013100 conversations to get 5\u201310 yeses. This is a numbers game.",
  "Spending 6 months fundraising instead of building. The best way to raise money is to not need it.",
  "Not having a lead investor. A round without a lead is a round that never closes.",
  "Giving board seats too early. At pre-seed, nobody needs a board seat. You\u2019re giving away control for a $200K check.",
  "Ignoring the terms because the valuation looks good. Liquidation preferences, anti-dilution, and participation rights matter more than the headline number.",
  "Pitching features instead of the market. Investors don\u2019t fund products. They fund markets and teams that can capture them.",
  "Not knowing your numbers. If an investor asks your MRR, churn, or CAC and you hesitate, the meeting is over.",
];

// ── Page ──

export default function FundraisingPage() {
  return (
    <article className="mx-auto max-w-[680px] px-6 py-16 md:py-24">
      {/* Title */}
      <header>
        <h1 className="font-heading text-[clamp(2.5rem,6vw,3.5rem)] italic font-extralight leading-[1.1] tracking-[-0.03em] text-black">
          Fundraising
        </h1>
        <div className="mt-8 flex items-center gap-3 text-[13px] text-black/40">
          <span>12 min read</span>
        </div>
      </header>

      {/* Opening — large lede */}
      <p className="mt-14 text-[22px] leading-[1.75] text-black/70 font-light">
        Raising money is not winning. It&apos;s not validation. It&apos;s not a
        milestone. It&apos;s trading ownership of your company for cash &mdash;
        and taking on a boss. Every dollar you raise comes with expectations,
        timelines, and someone else&apos;s definition of success.
      </p>

      <div className="mt-16 space-y-12">
        {/* Should you raise? */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Should you raise at all?
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            Before you start building a pitch deck, ask yourself a harder
            question:{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              do you actually need other people&apos;s money?
            </span>{" "}
            Bootstrapping means you keep 100% of your company, answer to no one,
            and grow at whatever pace makes sense. The trade-off is slower
            growth, less margin for error, and doing everything yourself.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            VC-backed means you grow fast or die trying. You&apos;ll have money
            to hire, to spend on marketing, to survive mistakes. But you&apos;ll
            also have investors expecting 10x returns, board meetings, and a
            clock ticking toward the next round.{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              Most venture-backed startups fail. That&apos;s not a bug &mdash;
              it&apos;s the model.
            </span>
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            Raise if your market requires speed and capital to win. Raise if
            you can&apos;t build what you need to build with what you have.
            Don&apos;t raise because it feels like the thing founders are
            supposed to do.
          </p>
        </section>

        {/* Pull quote */}
        <blockquote className="border-l-[3px] border-black pl-8">
          <p className="text-[24px] font-light leading-[1.6] tracking-[-0.01em] text-black/80 italic">
            Raising money is not winning. It&apos;s taking on a boss.
          </p>
        </blockquote>

        {/* SAFEs explained */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            SAFEs explained
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            A SAFE is the most common way to raise money at the earliest stages.
            An investor gives you money now. In return, they get the right to
            receive shares later &mdash; typically when you raise a priced
            round.{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              There&apos;s no interest, no maturity date, and no monthly
              payments.
            </span>{" "}
            It&apos;s not debt. It&apos;s a promise of future equity.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            SAFEs come with a valuation cap and sometimes a discount. The cap
            sets the maximum price at which the SAFE converts. If your cap is
            $10M and you raise your Series A at $30M, the SAFE investor converts
            at $10M &mdash; getting 3x more shares per dollar than the new
            investors. The discount works similarly: a 20% discount means the
            SAFE investor pays 80 cents on the dollar.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            The trap:{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              SAFEs are so easy to sign that founders stack them without tracking
              the math.
            </span>{" "}
            Five SAFEs at different caps and discounts, plus an option pool, and
            suddenly you&apos;re walking into your Series A already owning less
            than half of your company. Every SAFE you sign is dilution you
            haven&apos;t felt yet.
          </p>
        </section>

        {/* Priced rounds vs SAFEs */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Priced rounds vs SAFEs
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            A priced round means you actually set a share price, issue stock,
            and formalize who owns what. It&apos;s more expensive &mdash;
            lawyers, board formation, shareholder agreements &mdash; but
            it&apos;s cleaner.{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              Everyone knows exactly what they own.
            </span>
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            SAFEs make sense when you&apos;re raising a small amount quickly
            from angels and you don&apos;t want to spend $15K on legal fees. A
            priced round makes sense when you&apos;re raising $1M or more, when
            you have a lead investor, or when you&apos;ve stacked so many SAFEs
            that the cap table is becoming a riddle. Most Series A rounds and
            beyond are priced rounds.
          </p>
        </section>

        {/* How VCs decide */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            How VCs actually decide
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            VCs are pattern-matching machines. They see thousands of companies a
            year and say yes to a handful. Here&apos;s what they&apos;re
            actually evaluating:
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              Market size.
            </span>{" "}
            Is this a billion-dollar market? VCs need each investment to have
            the potential to return the entire fund. A great team in a small
            market is a pass.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              Team.
            </span>{" "}
            Have you done this before? Do you have unfair advantages in this
            space? Can you recruit? VCs are betting on people as much as
            products.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              Traction.
            </span>{" "}
            Revenue, users, growth rate &mdash; hard numbers beat a good story
            every time. If you have traction, lead with it. If you don&apos;t,
            you need a very compelling reason why.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            What they won&apos;t tell you: a lot of VC decision-making is
            social proof. If Sequoia is interested, everyone&apos;s interested.
            If nobody&apos;s leading, nobody wants to lead.{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              Fundraising is a momentum game.
            </span>
          </p>
        </section>

        {/* The timeline */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            The timeline nobody tells you
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            First-time founders think fundraising takes a few weeks. It
            doesn&apos;t.{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              A typical seed round takes 3&ndash;6 months from first meeting to
              money in the bank.
            </span>{" "}
            Series A and beyond can take longer.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            The math is brutal. You&apos;ll email 200 investors. Maybe 80 take
            an intro call. 40 take a first meeting. 15 go to a second meeting.
            5&ndash;10 express real interest. 2&ndash;5 give you a term sheet or
            sign a SAFE.{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              You need a thick skin and a short memory.
            </span>
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            While you&apos;re fundraising, you&apos;re not building. This is
            the real cost. Your product stalls, your team waits, your customers
            wonder where you went. Run a tight process: set a timeline, batch
            your meetings, and create urgency. The longer you fundraise, the
            weaker your position.
          </p>
        </section>

        {/* Pull quote */}
        <blockquote className="border-l-[3px] border-black pl-8">
          <p className="text-[24px] font-light leading-[1.6] tracking-[-0.01em] text-black/80 italic">
            The best way to raise money is to not need it. The second best
            way is to be so good they can&apos;t ignore you.
          </p>
        </blockquote>

        {/* Valuation */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Valuation
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            Your valuation at the early stage is mostly a negotiation, not a
            calculation. There&apos;s no DCF model, no comparable analysis. It&apos;s
            what an investor is willing to pay, influenced by market conditions,
            your traction, and how many other investors want in.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              Optimizing for the highest valuation is a common and expensive
              mistake.
            </span>{" "}
            A sky-high valuation at your seed means you need to grow into it by
            Series A. If you can&apos;t, you either raise a down round
            &mdash; brutal for morale and dilution &mdash; or you can&apos;t
            raise at all. A fair valuation with great investors beats a vanity
            number with mediocre ones.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            Typical ranges: pre-seed is $3&ndash;8M post-money, seed is
            $8&ndash;20M, Series A is $30&ndash;80M. These shift with market
            conditions. In 2021, everything was 2&ndash;3x higher. In 2023,
            everything corrected.{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              Don&apos;t anchor to what someone else raised in a different
              market.
            </span>
          </p>
        </section>

        {/* Dilution */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Dilution reality
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            Here&apos;s the math nobody wants to talk about. Two co-founders
            start with 50% each. Then reality happens:
          </p>
          <div className="mt-6 space-y-4">
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              Option pool created (10%): founders go from 100% to 90%. Each founder now owns 45%.
            </p>
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              Pre-seed SAFE ($500K at $5M post-money cap): 10% dilution. Each founder now owns ~40%.
            </p>
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              Seed round ($2M at $15M post-money): ~13% dilution. Each founder now owns ~35%.
            </p>
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              Option pool expanded (another 5%): Each founder now owns ~33%.
            </p>
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              Series A ($10M at $50M post-money): 20% dilution. Each founder now owns ~26%.
            </p>
          </div>
          <p className="mt-6 text-[18px] leading-[2] text-black/55">
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              You started with 50%. By Series A, you own 26%.
            </span>{" "}
            And that&apos;s a good outcome. Many founders own less than 20% by
            the time they raise a Series B. This isn&apos;t wrong &mdash;
            26% of a $50M company is worth more than 50% of a $0 company. But
            you need to go in with open eyes.
          </p>
        </section>

        {/* The pitch */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            The pitch
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            Investors don&apos;t want a product demo. They want a story about
            the future and evidence that you&apos;re the one who can build it.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              Lead with the problem, not your solution.
            </span>{" "}
            Make them feel the pain before you show the painkiller. The best
            pitches make the investor think &ldquo;why doesn&apos;t this
            exist?&rdquo; before you show them that it does.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            What investors actually want to hear: a massive market, a clear
            insight that others are missing, early proof that it&apos;s working,
            a team that has an unfair advantage, and a plan for how this money
            gets you to the next milestone.{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              They&apos;re not investing in what you&apos;ve built. They&apos;re
              investing in what you&apos;ll build with their money.
            </span>
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            Know your numbers cold. MRR, growth rate, churn, CAC, LTV. If an
            investor asks and you fumble, the meeting is over. You don&apos;t
            need to have great numbers. You need to know them and have a story
            for why they&apos;ll get better.
          </p>
        </section>

        {/* Mistakes */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Common fundraising mistakes
          </h2>
          <div className="mt-6 space-y-4">
            {MISTAKES.map((m, i) => (
              <p key={i} className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
                {m}
              </p>
            ))}
          </div>
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
          href="/business/pricing"
          className="inline-flex items-center gap-2.5 border border-black bg-black px-6 py-3.5 text-[15px] font-medium text-white transition-colors hover:bg-black/90"
        >
          Next: Pricing
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
        <Link
          href="/legal/safes"
          className="inline-flex items-center gap-2.5 border border-black/[0.15] px-6 py-3.5 text-[15px] font-medium text-black transition-colors hover:bg-black/[0.03]"
        >
          Open SAFE Tracker
        </Link>
      </div>
    </article>
  );
}
