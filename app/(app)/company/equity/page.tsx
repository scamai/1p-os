"use client";

import Link from "next/link";

// ── Keywords ──

const KEYWORDS: { term: string; explanation: string }[] = [
  {
    term: "Vesting",
    explanation: "Equity earned over time, not given upfront. The standard is 4 years with monthly vesting after the cliff. If you leave before your shares fully vest, the unvested portion goes back to the company.",
  },
  {
    term: "Cliff",
    explanation: "A waiting period — usually 12 months — before any equity vests at all. If a co-founder or employee leaves before the cliff, they walk away with zero shares. It\u2019s the startup equivalent of a probation period.",
  },
  {
    term: "83(b) Election",
    explanation: "An IRS filing that lets you pay tax on your shares at their current (low) value instead of their future (hopefully much higher) value. You have exactly 30 days after receiving restricted stock to file it. Miss the deadline and there\u2019s no second chance.",
  },
  {
    term: "Cap Table",
    explanation: "A spreadsheet — or software — that tracks who owns what percentage of the company. Every share, every option, every SAFE. Investors will scrutinize this before writing a check. Keep it clean or pay for it later.",
  },
  {
    term: "ESOP",
    explanation: "Employee Stock Option Pool. A block of shares — typically 10\u201315% of the company — reserved for future hires. VCs will usually require one before investing, and the shares come out of the founders\u2019 ownership, not the investors\u2019.",
  },
  {
    term: "Dilution",
    explanation: "When new shares are created — usually during a funding round — everyone\u2019s ownership percentage goes down, even though the value of their shares may go up. Owning 50% of a $2M company is worth less than owning 30% of a $50M company.",
  },
  {
    term: "Pro Rata",
    explanation: "An investor\u2019s right to participate in future rounds to maintain their ownership percentage. If they own 10% and you raise again, pro rata lets them invest enough to keep that 10%. It\u2019s a privilege, not an obligation.",
  },
  {
    term: "Preferred vs Common Stock",
    explanation: "Founders and employees get common stock. Investors get preferred stock, which comes with extra rights — liquidation preference, anti-dilution protection, board seats. In a bad exit, preferred shareholders get paid first. Common shareholders get what\u2019s left.",
  },
];

const MISTAKES = [
  "Splitting equity 50/50 because you\u2019re afraid of a hard conversation. The conversation gets harder when one person is doing 80% of the work.",
  "No vesting schedule. A co-founder leaves after 4 months with 40% of the company. Good luck raising money now.",
  "Missing the 83(b) election deadline. Thirty days. That\u2019s it. Set an alarm, file it certified mail, keep the receipt forever.",
  "Giving away equity to \u201Cadvisors\u201D who send one email a quarter. Advisor shares should vest monthly and rarely exceed 0.25\u20131%.",
  "Promising equity verbally without paperwork. \u201CWe\u2019ll figure it out later\u201D is how lawsuits start.",
  "Not reserving an option pool early. If you wait until a VC forces it, the dilution comes entirely out of your pocket.",
  "Issuing shares without understanding the tax implications. Stock grants, options, and SAFEs all have different tax treatment. Talk to a lawyer before you sign anything.",
  "Treating equity like Monopoly money. Every share you give away is a piece of the thing you\u2019re spending years building. Treat it accordingly.",
];

// ── Page ──

export default function EquityPage() {
  return (
    <article className="mx-auto max-w-[680px] px-6 py-16 md:py-24">
      {/* Title */}
      <header>
        <h1 className="font-heading text-[clamp(2.5rem,6vw,3.5rem)] italic font-extralight leading-[1.1] tracking-[-0.03em] text-black">
          Equity
        </h1>
        <div className="mt-8 flex items-center gap-3 text-[13px] text-black/40">
          <span>7 min read</span>
        </div>
      </header>

      {/* Opening — large lede */}
      <p className="mt-14 text-[22px] leading-[1.75] text-black/70 font-light">
        Equity is the most expensive spreadsheet you&apos;ll ever make. Get it
        wrong and you&apos;ll spend years building a company you don&apos;t
        actually own. Get it right and it&apos;s the single most powerful tool
        you have to attract talent, raise money, and stay motivated when
        everything else is on fire.
      </p>

      {/* Sections */}
      <div className="mt-16 space-y-12">
        {/* Why equity matters */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Why equity matters
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            When you incorporate, you create shares out of thin air. They&apos;re
            worth nothing on day one. But every decision you make from that point
            forward &mdash; who gets shares, how many, under what terms &mdash;
            determines who controls the company and who profits when it succeeds.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              Equity mistakes are nearly impossible to undo.
            </span>{" "}
            You can pivot your product, fire a bad hire, even change your market.
            But restructuring your cap table after the fact? That requires
            lawyers, tax implications, and often the consent of people who have
            no incentive to give it.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            Most founders don&apos;t think about equity until it&apos;s too late.
            They&apos;re so focused on building that they treat ownership as an
            afterthought. Then they try to raise a round and an investor asks to
            see the cap table, and suddenly that afterthought becomes the only
            thing that matters.
          </p>
        </section>

        {/* Pull quote */}
        <blockquote className="border-l-[3px] border-black pl-8">
          <p className="text-[24px] font-light leading-[1.6] tracking-[-0.01em] text-black/80 italic">
            Equity is not compensation. It&apos;s ownership. Every percentage
            point you give away is a piece of your company you never get back.
          </p>
        </blockquote>

        {/* Equity splits */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Equity splits between co-founders
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            The default for two co-founders is 50/50. It feels fair. It feels
            egalitarian. And in most cases,{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              it&apos;s wrong.
            </span>
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            Equal splits work when both founders bring exactly equal value &mdash;
            same time commitment, same skills, same risk. That almost never
            happens. One person had the idea. One person quit their job six
            months earlier. One person wrote the first 10,000 lines of code.
            One person brought the first customer.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              A slightly unequal split with clear reasoning is better than an
              equal split that breeds resentment.
            </span>{" "}
            Have the conversation early. Factor in who&apos;s full-time vs
            part-time, who&apos;s investing capital, who has domain expertise that
            can&apos;t be hired for, and who will be CEO. A 55/45 or 60/40 split
            with honest rationale is far healthier than a 50/50 split where one
            person secretly thinks they deserve more.
          </p>
        </section>

        {/* Vesting */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Vesting schedules
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            The standard vesting schedule is 4 years with a 1-year cliff. Here&apos;s
            what that means: you get nothing for the first 12 months. On your
            one-year anniversary, 25% of your shares vest at once. After that,
            the remaining 75% vest monthly over the next 3 years.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              Vesting protects everyone.
            </span>{" "}
            It protects you from a co-founder who leaves early and keeps half the
            company. It protects your co-founder from you doing the same thing.
            And it signals to investors that both founders are committed for the
            long haul.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            &ldquo;But we trust each other&rdquo; is not a vesting schedule.
            Every investor will ask if you have vesting in place. If you
            don&apos;t, that&apos;s not just a yellow flag &mdash;{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              it&apos;s a deal-breaker.
            </span>{" "}
            Even solo founders should vest their own shares. It shows discipline
            and makes future fundraising smoother.
          </p>
        </section>

        {/* 83(b) Elections */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            The 83(b) election
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            This is the $50,000 mistake most first-time founders don&apos;t even
            know exists.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            When you receive restricted stock that vests over time, the IRS
            considers each vesting event a taxable event. Without an 83(b)
            election, you owe ordinary income tax on the shares as they vest
            &mdash; at their fair market value at the time of vesting. If your
            company is worth $0.001 per share when you start but $10 per share
            when your shares vest two years later, you owe tax on $10 per share.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              An 83(b) election lets you pay tax upfront, at the current value.
            </span>{" "}
            If you file it when your shares are worth nearly nothing, you pay
            nearly nothing in tax. Then when they&apos;re worth $10 and you sell,
            you pay capital gains &mdash; which is a much lower rate than
            ordinary income tax.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            The catch:{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              you have exactly 30 days from the date you receive your shares to
              file it.
            </span>{" "}
            Not 30 business days. Not 30 days from when you remember. Thirty
            calendar days. Miss it and there is no extension, no exception, no
            appeals process. Mail it certified, keep the receipt, and send a
            copy with your tax return. This is one of the few irreversible
            deadlines in startup law.
          </p>
        </section>

        {/* Pull quote */}
        <blockquote className="border-l-[3px] border-black pl-8">
          <p className="text-[24px] font-light leading-[1.6] tracking-[-0.01em] text-black/80 italic">
            The 83(b) election is a one-page form that takes ten minutes to
            fill out. Forgetting it can cost you tens of thousands of dollars
            in unnecessary taxes.
          </p>
        </blockquote>

        {/* Cap table hygiene */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Cap table hygiene
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            Your cap table is a living document that tracks every share, option,
            warrant, and convertible note in your company. On day one it&apos;s
            simple &mdash; two founders, 10 million shares, done. By the time
            you raise a Series A, it includes SAFEs, an option pool, advisor
            grants, and investor preferences.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              Investors will audit your cap table before they invest.
            </span>{" "}
            If it&apos;s a mess &mdash; unclear ownership percentages, missing
            vesting schedules, phantom equity promises written on napkins &mdash;
            they will walk away. Not because they don&apos;t like your product,
            but because a messy cap table signals a founder who doesn&apos;t take
            the business side seriously.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            Start with a spreadsheet if you have to, but graduate to proper cap
            table software early. Carta, Pulley, AngelList &mdash; pick one.
            Track every grant, every transfer, every conversion. Your future
            self and your future lawyers will thank you.
          </p>
        </section>

        {/* ESOP */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            ESOP and option pools
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            An Employee Stock Option Pool is a block of shares &mdash; typically
            10&ndash;15% of the company &mdash; set aside for future employees.
            It&apos;s how you attract engineers, designers, and operators when
            you can&apos;t compete on salary.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            Here&apos;s the part most founders don&apos;t realize:{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              the option pool comes out of the founders&apos; shares, not the
              investors&apos;.
            </span>{" "}
            When a VC says &ldquo;we want a 15% option pool pre-money,&rdquo;
            they&apos;re saying that dilution hits you, not them. This is
            standard, but you need to understand it before you negotiate.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            Create the pool before you need it. If you wait until a VC demands
            it, you lose negotiating leverage. If you create it early and
            only allocate what you need, you can roll unused options into
            future rounds. Be generous but precise &mdash; every option you
            issue should have a clear vesting schedule and strike price.
          </p>
        </section>

        {/* Dilution */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Dilution reality
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            Dilution scares first-time founders. It shouldn&apos;t &mdash; as
            long as you understand it.{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              Dilution is not losing ownership. It&apos;s sharing ownership with
              people who make the pie bigger.
            </span>
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            Here&apos;s what a typical dilution path looks like. You start with
            100%. You set aside 10% for an option pool &mdash; you&apos;re at
            90%. You raise a seed round and give up 20% &mdash; you&apos;re at
            72%. Series A takes another 20% &mdash; you&apos;re at 57%. The
            option pool gets topped up to 15% &mdash; maybe you&apos;re at 48%.
            Series B takes 15% &mdash; you&apos;re at 41%.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            By the time you IPO or sell, a successful founder might own
            15&ndash;25% of the company. That sounds low until you remember that
            15% of a $500M company is $75M. The goal is not to maximize your
            percentage &mdash;{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              it&apos;s to maximize the value of your percentage.
            </span>
          </p>
        </section>

        {/* Mistakes */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Common equity mistakes
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
      <div className="mt-16 pb-8">
        <Link
          href="/company/incorporation"
          className="inline-flex items-center gap-2.5 border border-black bg-black px-6 py-3.5 text-[15px] font-medium text-white transition-colors hover:bg-black/90"
        >
          Set up your incorporation
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </div>
    </article>
  );
}
