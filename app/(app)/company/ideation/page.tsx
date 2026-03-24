"use client";

import Link from "next/link";

// ── Keywords ──

const KEYWORDS: { term: string; explanation: string }[] = [
  {
    term: "Founder\u2013Idea Fit",
    explanation: "Are you the right person to solve this problem? Do you have the domain knowledge, the network, or the lived experience? An outsider can build in any space, but a founder with deep context moves 10x faster and earns trust 10x easier.",
  },
  {
    term: "Founder\u2013Market Fit",
    explanation: "Do you understand the market you\u2019re entering well enough to win? Can you name 20 potential customers right now? Do you know how they buy, what they pay, and what they\u2019ve tried before? If you can\u2019t, you\u2019re guessing.",
  },
  {
    term: "Problem\u2013Solution Fit",
    explanation: "Does your solution actually fix the problem? Not theoretically \u2014 actually. Have you put it in front of real people and watched them use it? Did they pull out their wallet or just say \u201Ccool idea\u201D?",
  },
  {
    term: "Product\u2013Market Fit",
    explanation: "The moment your product sells itself. Users come back without being asked. Growth happens without paid ads. Churn drops. You feel it \u2014 demand exceeds your capacity. Most startups never reach this. The ones that do usually pivoted 2\u20133 times to get there.",
  },
  {
    term: "TAM / SAM / SOM",
    explanation: "Total Addressable Market, Serviceable Addressable Market, Serviceable Obtainable Market. In plain English: how big is the entire market, how much of it can you realistically serve, and how much can you actually capture in the next 2\u20133 years? Investors will ask. Have real numbers, not fantasies.",
  },
  {
    term: "Unfair Advantage",
    explanation: "Something you have that can\u2019t be easily copied or bought. Proprietary data, a unique network, deep domain expertise, a patent, or speed. If your only advantage is \u201Cwe\u2019ll work harder,\u201D you don\u2019t have one yet.",
  },
];

const IDEA_TRAPS = [
  "Building something you think is cool instead of something people need.",
  "Asking friends if your idea is good. They\u2019ll say yes to be nice.",
  "Spending 6 months building before talking to a single customer.",
  "Falling in love with the solution instead of the problem.",
  "Thinking \u201Cif we capture just 1% of the market\u201D is a strategy.",
  "\u201CNobody is doing this\u201D usually means nobody wants it, not that you\u2019re first.",
  "Pivoting every two weeks because you\u2019re chasing trends instead of conviction.",
];

const VALIDATION_STEPS = [
  "Talk to 20 people who have the problem. Not your friends \u2014 strangers.",
  "Ask what they\u2019ve tried before. If the answer is \u201Cnothing,\u201D the problem isn\u2019t painful enough.",
  "Ask what they\u2019d pay. If they hesitate, it\u2019s a vitamin, not a painkiller.",
  "Build the smallest thing that tests your core assumption. Not a full product \u2014 a test.",
  "Measure behavior, not words. Did they sign up? Did they come back? Did they pay?",
];

// ── Page ──

export default function IdeationPage() {
  return (
    <article className="mx-auto max-w-[680px] px-6 py-16 md:py-24">
      {/* Title */}
      <header>
        <h1 className="font-heading text-[clamp(2.5rem,6vw,3.5rem)] italic font-extralight leading-[1.1] tracking-[-0.03em] text-black">
          Ideation
        </h1>
        <div className="mt-8 flex items-center gap-3 text-[13px] text-black/40">
          <span>10 min read</span>
        </div>
      </header>

      {/* Opening — large lede */}
      <p className="mt-14 text-[22px] leading-[1.75] text-black/70 font-light">
        Ideas are cheap. Everyone has one. The difference between a
        startup that works and one that doesn&apos;t isn&apos;t the idea &mdash;
        it&apos;s whether the founder is the right person, in the right
        market, solving a problem people will pay to fix.
      </p>

      {/* Founder-Idea Fit */}
      <div className="mt-16 space-y-12">
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Founder&ndash;Idea Fit
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            The question isn&apos;t &ldquo;is this a good idea?&rdquo; It&apos;s{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              &ldquo;are you the right person to build this?&rdquo;
            </span>
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            The best founders have an unfair insight into the problem they&apos;re
            solving. They lived it. They worked in the industry. They felt the
            pain firsthand. That doesn&apos;t mean you can&apos;t enter a new space &mdash;
            but if you do, you need to become the expert faster than anyone else.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            Ask yourself:{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              would I spend the next 5 years on this problem even if the
              startup fails?
            </span>{" "}
            If the answer is no, keep looking.
          </p>
        </section>

        {/* Founder-Market Fit */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Founder&ndash;Market Fit
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            Founder&ndash;market fit is about whether you can navigate the
            market you&apos;re entering.{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              Do you know how decisions get made? Do you know who the buyers are?
            </span>{" "}
            Can you get a meeting with your first 10 customers without a warm intro?
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            A technical founder building developer tools has founder&ndash;market
            fit. A developer building a wedding planning app probably doesn&apos;t.
            That doesn&apos;t mean it can&apos;t work &mdash; it means the learning curve
            is steeper and the risk is higher.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            The strongest signal:{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              can you name 20 people who have this problem right now?
            </span>{" "}
            Not personas. Real people. With phone numbers. If you can&apos;t,
            you don&apos;t know your market well enough yet.
          </p>
        </section>

        {/* Pull quote */}
        <blockquote className="border-l-[3px] border-black pl-8">
          <p className="text-[24px] font-light leading-[1.6] tracking-[-0.01em] text-black/80 italic">
            The best founders don&apos;t find ideas.
            They find problems they can&apos;t stop thinking about.
          </p>
        </blockquote>

        {/* Validation */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Validate before you build
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            The most expensive mistake in startups is building something nobody
            wants. In the AI era, you can build an MVP in a weekend. That&apos;s
            dangerous &mdash; because the ability to build fast makes it
            tempting to skip the part where you check if anyone cares.
          </p>
          <div className="mt-6 space-y-4">
            {VALIDATION_STEPS.map((s, i) => (
              <p key={i} className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
                {s}
              </p>
            ))}
          </div>
        </section>

        {/* Idea frameworks */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Frameworks that actually help
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            Frameworks aren&apos;t magic. They&apos;re checklists that force you
            to think clearly. Use them to pressure-test your idea, not to
            convince yourself it&apos;s good.
          </p>

          <div className="mt-8 space-y-8">
            <div>
              <p className="text-[20px] font-medium leading-[1.4] text-black">
                The Mom Test
              </p>
              <p className="mt-2 text-[17px] leading-[1.9] text-black/50">
                Don&apos;t ask people if your idea is good. Ask about their life,
                their problems, their workarounds. If you mention your idea and
                they say &ldquo;that&apos;s cool,&rdquo; you&apos;ve learned nothing.
                If they describe the exact problem you&apos;re solving without
                you prompting them, you&apos;re onto something.
              </p>
            </div>

            <div>
              <p className="text-[20px] font-medium leading-[1.4] text-black">
                Problem &rarr; Customer &rarr; Solution
              </p>
              <p className="mt-2 text-[17px] leading-[1.9] text-black/50">
                Start with the problem, not the solution. Who has this problem?
                How are they solving it today? What would they pay for a better
                answer? Only then do you design the product. Most founders do
                this backwards.
              </p>
            </div>

            <div>
              <p className="text-[20px] font-medium leading-[1.4] text-black">
                The Riskiest Assumption Test
              </p>
              <p className="mt-2 text-[17px] leading-[1.9] text-black/50">
                Every startup has one assumption that, if wrong, kills the whole
                thing. Find that assumption and test it first. Don&apos;t build
                the product, the landing page, the brand &mdash; test the thing
                that matters most. Everything else is procrastination.
              </p>
            </div>
          </div>
        </section>

        {/* Idea traps */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Traps that kill ideas
          </h2>
          <div className="mt-6 space-y-4">
            {IDEA_TRAPS.map((t, i) => (
              <p key={i} className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
                {t}
              </p>
            ))}
          </div>
        </section>

        {/* Why now */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Why now?
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            Timing kills more startups than bad ideas. The question
            isn&apos;t just &ldquo;is this a good idea?&rdquo; &mdash; it&apos;s{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              &ldquo;why does this need to exist right now?&rdquo;
            </span>
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            What changed? A new regulation? A technology shift? A behavior
            change? A cost that dropped 100x? If you can&apos;t point to
            something specific that makes this possible today but wasn&apos;t
            possible two years ago, investors will pass &mdash; and they
            should. &ldquo;It&apos;s a good idea&rdquo; isn&apos;t enough.
            Good ideas that are too early are indistinguishable from bad ideas.
          </p>
        </section>

        {/* Distribution */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Distribution beats product
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            There&apos;s a saying in startups:{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              first-time founders obsess over product. Second-time founders
              obsess over distribution.
            </span>
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            How will people find you? &ldquo;Build it and they&apos;ll
            come&rdquo; is not a strategy. It&apos;s a prayer. Before you
            write a line of code, you should be able to answer: where do
            my customers hang out? How do they discover new tools? What
            would make them switch from what they&apos;re using today?
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            The best product in the world loses to a worse product with
            better distribution. Every time.
          </p>
        </section>

        {/* 10x rule */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            The 10x rule
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            Your product needs to be{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              10x better than the alternative, not 2x.
            </span>{" "}
            People don&apos;t switch for &ldquo;slightly better.&rdquo; Switching
            has a cost &mdash; learning a new tool, migrating data, changing
            habits. Your product needs to be so much better that the switching
            cost feels trivial.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            10x doesn&apos;t always mean 10x more features. It can mean
            10x faster, 10x cheaper, 10x simpler. Google wasn&apos;t 10x
            more powerful than Yahoo &mdash; it was 10x simpler. Stripe
            wasn&apos;t 10x more capable than PayPal &mdash; it was 10x
            easier to integrate.
          </p>
        </section>

        {/* Competition is good */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Competition is good
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            &ldquo;We have no competitors&rdquo; is a red flag, not a flex.
            It usually means one of two things: you haven&apos;t looked hard
            enough, or there&apos;s no market.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              Competitors validate demand.
            </span>{" "}
            They prove people care about the problem enough to pay for a
            solution. Your job isn&apos;t to be alone in the market &mdash;
            it&apos;s to be different. Find the angle they&apos;re missing,
            the segment they&apos;re ignoring, the experience they&apos;re
            getting wrong.
          </p>
        </section>

        {/* Project vs business */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Project vs. business
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            Can you charge money for this on day one? Not &ldquo;eventually&rdquo;
            or &ldquo;once we have enough users.&rdquo; Day one.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            If nobody will pay for it, you have a project. Projects are
            fine &mdash; but don&apos;t confuse them with businesses.{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              Revenue is the only validation that matters.
            </span>{" "}
            Users are vanity. Downloads are vanity. Signups are vanity.
            Someone handing you their credit card &mdash; that&apos;s real.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            The fastest way to know if your idea works: put a price on
            it and see who pays. If you&apos;re afraid to charge, ask
            yourself why. The answer will tell you more about your idea
            than any framework ever will.
          </p>
        </section>

        {/* Pivoting */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            When to pivot vs. when to persist
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            The data will tell you. If you&apos;ve talked to 50 potential
            customers and none of them will pay, the idea needs to change.
            If 5 out of 50 are pulling out their wallet, you have something &mdash;
            narrow your focus on those 5.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              Pivoting is not failure. Refusing to pivot when the evidence says
              you should &mdash; that&apos;s failure.
            </span>{" "}
            Slack, YouTube, Instagram, and Twitter all started as something
            completely different.
          </p>
        </section>

        {/* AI risk pull quote */}
        <blockquote className="border-l-[3px] border-black pl-8">
          <p className="text-[24px] font-light leading-[1.6] tracking-[-0.01em] text-black/80 italic">
            If the next Claude update or GPT release can replace
            your entire product &mdash; you don&apos;t have a company.
            You have a feature.
          </p>
        </blockquote>

        {/* The AI reality */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            The AI reality check
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            This is the part nobody wants to hear.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            AI has changed the game completely. Anyone can build a product
            in a weekend now. A solo founder with Claude or Cursor can
            ship what used to take a team of ten. That sounds like good
            news &mdash;{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              until you realize your competitors have the same tools.
            </span>
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            The barrier to building is gone. That means{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              the barrier to competition is gone too.
            </span>{" "}
            If you can build it in a weekend, so can someone else. If
            your product is a thin wrapper around an API call, you&apos;re
            one model update away from irrelevance.
          </p>

          <h3 className="mt-10 text-[20px] font-medium leading-[1.4] text-black">
            What AI can kill overnight
          </h3>
          <div className="mt-5 space-y-4">
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              Any product that is just a UI on top of an LLM API.
              OpenAI, Anthropic, and Google will build that UI themselves.
              They always do.
            </p>
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              Any product whose only moat is &ldquo;we built it first.&rdquo;
              Speed is an advantage for months, not years. Someone with
              better distribution will clone you and win.
            </p>
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              Any product that doesn&apos;t get better with more users.
              If your product works exactly the same for user #1 and user
              #10,000, you have no network effect and no compounding advantage.
            </p>
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              Any product that can be replicated by a better prompt.
              Seriously. Try asking Claude to do what your product does.
              If it can, that&apos;s your answer.
            </p>
          </div>

          <h3 className="mt-10 text-[20px] font-medium leading-[1.4] text-black">
            What AI can&apos;t kill
          </h3>
          <div className="mt-5 space-y-4">
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              Proprietary data that gets richer over time. Your users
              generate data that makes the product better for everyone.
              That&apos;s a moat no model update can replicate.
            </p>
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              Network effects. Every new user makes the product more
              valuable for existing users. Marketplaces, communities,
              platforms &mdash; these compound. A better AI doesn&apos;t help
              if you don&apos;t have the users.
            </p>
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              Deep integrations into workflows. If your product is embedded
              in how a business operates daily &mdash; in their data, their
              processes, their habits &mdash; switching costs protect you.
            </p>
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              Trust and relationships. Regulated industries, enterprise
              sales, high-stakes decisions. Nobody buys compliance software
              from a startup they found on Product Hunt yesterday. Trust
              takes years to build and seconds to lose.
            </p>
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              Real-world operations. Logistics, hardware, supply chains,
              physical services. AI can optimize these but can&apos;t replace
              the truck, the warehouse, or the human showing up at your door.
            </p>
          </div>

          <h3 className="mt-10 text-[20px] font-medium leading-[1.4] text-black">
            The test
          </h3>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            Before you build anything, ask yourself this:
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              &ldquo;If Anthropic releases a new model tomorrow that is 10x
              better and 10x cheaper &mdash; does my company get stronger
              or weaker?&rdquo;
            </span>
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            If your company gets stronger &mdash; because you use AI as
            infrastructure, not as the product &mdash; you&apos;re building
            on solid ground. Every model improvement makes you better,
            faster, cheaper.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            If your company gets weaker &mdash; because a smarter model
            makes your product unnecessary &mdash;{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              stop building and rethink.
            </span>{" "}
            You are standing on a trapdoor.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            Use AI to build faster. Use AI to operate leaner. But don&apos;t
            build a company that{" "}
            <span className="italic">is</span> AI. Build a company that{" "}
            <span className="italic">uses</span> AI to do something that
            matters &mdash; something that requires your data, your users,
            your insight, your relationships. Something a model can&apos;t
            just hallucinate into existence.
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
      <div className="mt-16 pb-8">
        <Link
          href="/company/equity"
          className="inline-flex items-center gap-2.5 border border-black bg-black px-6 py-3.5 text-[15px] font-medium text-white transition-colors hover:bg-black/90"
        >
          Set up your equity
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </div>
    </article>
  );
}
