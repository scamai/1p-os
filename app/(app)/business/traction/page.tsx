"use client";

import Link from "next/link";

// ── Keywords ──

const KEYWORDS: { term: string; explanation: string }[] = [
  {
    term: "Design Partner",
    explanation: "A customer who works with you before the product is finished. They give you access to their workflow, their pain points, and their honest feedback. In return, they get the product early \u2014 often free or heavily discounted \u2014 and influence over the roadmap. A good design partner is worth more than 100 survey responses.",
  },
  {
    term: "Pilot",
    explanation: "A time-boxed trial where a real customer uses your product in a real environment with real stakes. Unlike a demo, a pilot tests whether the product actually works in their world \u2014 not whether it looks good in yours. Pilots that convert to paid contracts are the strongest traction signal that exists.",
  },
  {
    term: "Letter of Intent (LOI)",
    explanation: "A written commitment from a potential customer saying they intend to buy your product once it\u2019s ready. Not legally binding, but socially binding \u2014 people who put things in writing follow through more often. Investors love LOIs because they prove demand before the product exists.",
  },
  {
    term: "Waitlist",
    explanation: "A list of people who want access before you\u2019re ready to give it. Easy to create, easy to inflate, easy to fake. A waitlist of 10,000 emails means nothing if nobody opens your launch email. A waitlist of 50 people who paid a deposit means everything.",
  },
  {
    term: "Design Win",
    explanation: "When a customer commits to building their workflow around your product. In enterprise, this is the moment you stop being evaluated and start being integrated. Design wins are sticky \u2014 once a customer has built around you, switching costs protect you.",
  },
  {
    term: "Lighthouse Customer",
    explanation: "A well-known, respected company that uses your product and is willing to say so publicly. One Fortune 500 logo on your website is worth more than 50 unknown logos. Investors call this \u201Csocial proof.\u201D Customers call it \u201Cif it\u2019s good enough for them, it\u2019s good enough for us.\u201D",
  },
  {
    term: "Product-Market Fit (PMF)",
    explanation: "The moment your product sells itself. Users come back without being asked. Growth happens without paid ads. Churn drops. You feel it. Most startups never reach this. The ones that do usually pivoted 2\u20133 times to get there. Traction is how you find your way to PMF.",
  },
  {
    term: "MRR",
    explanation: "Monthly Recurring Revenue. The single most important number for a SaaS startup. Not total revenue \u2014 recurring revenue. One-time payments don\u2019t count. MRR tells you how much money you can count on next month, and the month after that.",
  },
  {
    term: "Activation Rate",
    explanation: "The percentage of signups who actually use the product in a meaningful way. A 10% activation rate means 90% of people who signed up never got value. Fix activation before you fix acquisition \u2014 there\u2019s no point pouring water into a leaky bucket.",
  },
];

const MISTAKES = [
  "Counting signups as traction. Signups are interest, not traction. Traction is when they come back the next day without you asking.",
  "Building for 12 months before talking to a single customer. You\u2019re not building a product \u2014 you\u2019re building a guess. The longer you wait, the more expensive the guess.",
  "Treating design partners as free beta testers. A design partner is a collaborator, not a guinea pig. If you\u2019re not changing your product based on their input, you\u2019re wasting their time and yours.",
  "Running a pilot without success criteria. If you don\u2019t define what \u201Csuccess\u201D means before the pilot starts, you\u2019ll spend the entire time arguing about whether it worked.",
  "Confusing busy with traction. Press coverage, conference talks, Twitter followers \u2014 none of this is traction. Revenue is traction. Retention is traction. A signed contract is traction. Everything else is noise.",
  "Raising money before you have traction because you think money will create traction. It won\u2019t. Money amplifies what\u2019s already working. If nothing is working, money just lets you fail more expensively.",
  "Giving your product away forever because you\u2019re afraid to charge. Free users give you feedback. Paying customers give you validation. There is a difference.",
  "Optimizing acquisition before retention. If people leave after a week, getting more people to sign up just means more people leaving after a week. Fix the product first.",
];

// ── Page ──

export default function TractionPage() {
  return (
    <article className="mx-auto max-w-[680px] px-6 py-16 md:py-24">
      {/* Title */}
      <header>
        <h1 className="font-heading text-[clamp(2.5rem,6vw,3.5rem)] italic font-extralight leading-[1.1] tracking-[-0.03em] text-black">
          Traction
        </h1>
        <div className="mt-8 flex items-center gap-3 text-[13px] text-black/40">
          <span>11 min read</span>
        </div>
      </header>

      {/* Opening — large lede */}
      <p className="mt-14 text-[22px] leading-[1.75] text-black/70 font-light">
        Traction is proof. Proof that someone cares enough about the problem
        you&apos;re solving to use your product, pay for it, or at least
        commit to trying it. Without traction, you have a hypothesis. With
        it, you have a business &mdash; or at least the beginning of one.
      </p>

      {/* Sections */}
      <div className="mt-16 space-y-12">
        {/* What traction actually is */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            What traction actually is
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            Traction is not downloads. It&apos;s not signups. It&apos;s not
            press mentions or Twitter followers.{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              Traction is evidence that real people find your product
              valuable enough to keep using it &mdash; or pay for it.
            </span>
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            At the earliest stage, traction looks like five customers who
            love you, not 500 who signed up and forgot. It looks like someone
            pulling out their credit card, or a company signing a pilot
            agreement, or a user who comes back every single day without
            being prompted. The number doesn&apos;t matter as much as the
            intensity.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            Paul Graham said it best:{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              it&apos;s better to have 100 people who love you than 10,000
              who kind of like you.
            </span>{" "}
            Those 100 people will tell their friends, give you honest feedback,
            and stick with you through the ugly early versions. The 10,000
            will churn the moment something shinier appears.
          </p>
        </section>

        {/* Pull quote */}
        <blockquote className="border-l-[3px] border-black pl-8">
          <p className="text-[24px] font-light leading-[1.6] tracking-[-0.01em] text-black/80 italic">
            Traction is the antidote to storytelling. Investors can argue
            with your vision. They can&apos;t argue with a graph going up
            and to the right.
          </p>
        </blockquote>

        {/* Why traction matters */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Why traction changes everything
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            Traction affects every part of your startup:
          </p>
          <div className="mt-6 space-y-4">
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              <strong className="text-black/70">Fundraising.</strong>{" "}
              Investors fund traction more than ideas. A founder with $5K MRR
              and 20% month-over-month growth will raise money faster than a
              founder with a beautiful pitch deck and zero customers. Traction
              de-risks the investment. It shifts the conversation from
              &ldquo;will this work?&rdquo; to &ldquo;how fast can this scale?&rdquo;
            </p>
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              <strong className="text-black/70">Valuation.</strong>{" "}
              More traction means higher valuation, which means less dilution.
              A pre-revenue startup might raise at a $5M cap. The same startup
              with $10K MRR raises at $10&ndash;15M. That difference saves
              you 10&ndash;20% of your company.
            </p>
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              <strong className="text-black/70">Hiring.</strong>{" "}
              Talented people want to join companies that are working. Showing
              a candidate a revenue chart that&apos;s growing is more
              compelling than equity in an idea that might work. Traction
              is your best recruiting tool.
            </p>
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              <strong className="text-black/70">Confidence.</strong>{" "}
              Building a startup is psychologically brutal. Traction is the
              thing that keeps you going at 2am when everything else feels
              like it&apos;s falling apart. One paying customer who loves
              the product is worth a thousand encouraging tweets.
            </p>
          </div>
        </section>

        {/* Design partners */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Design partners
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            A design partner is a customer who builds the product with you.
            Not a beta tester who files bugs.{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              A collaborator who opens up their workflow, shows you their
              pain, and tells you when your solution doesn&apos;t actually
              solve anything.
            </span>
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            The best design partners are companies that have the problem
            you&apos;re solving, have tried other solutions, and are
            frustrated enough to invest time in helping you build the right
            one. They give you access to their team, their data, their
            processes. In return, they get early access, preferential
            pricing, and a product that actually fits their needs.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            How many do you need? Start with 3&ndash;5.{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              Enough to see patterns, few enough to go deep.
            </span>{" "}
            If all five design partners are telling you the same thing, you
            have a signal. If they&apos;re all saying different things,
            either your market is too broad or you haven&apos;t found the
            real problem yet.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            The deal with design partners should be explicit: weekly calls,
            access to their environment, honest feedback in exchange for
            free or discounted access during the design phase. Put it in
            writing. Not because you don&apos;t trust each other, but
            because clarity prevents disappointment.
          </p>
        </section>

        {/* Pilots */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Pilots
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            A pilot is a trial run with real stakes. Unlike a demo, where
            you control the environment,{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              a pilot tests your product in the customer&apos;s reality
              &mdash; their data, their edge cases, their impatient users.
            </span>
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            Structure your pilots carefully. Define success criteria before
            you start: what metrics will improve, by how much, over what
            time period. Without this, the pilot becomes an infinite
            evaluation that never converts to a contract.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            The ideal pilot is 30&ndash;60 days. Shorter than that and you
            don&apos;t have enough data. Longer and you&apos;re giving away
            free product. At the end of the pilot, there should be a clear
            decision point:{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              sign a contract or walk away.
            </span>{" "}
            No &ldquo;let&apos;s extend for another quarter.&rdquo;
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            The conversion rate from pilot to paid customer is one of the
            most important metrics you can track. Above 60% means your
            product works and your sales process is sound. Below 30% means
            something is broken &mdash; the product, the positioning, or
            the customers you&apos;re targeting.
          </p>
        </section>

        {/* Pull quote */}
        <blockquote className="border-l-[3px] border-black pl-8">
          <p className="text-[24px] font-light leading-[1.6] tracking-[-0.01em] text-black/80 italic">
            A pilot that converts to a paid contract is worth more than
            a thousand signups. It&apos;s proof that someone will pay for
            what you&apos;ve built, in the real world, with real money.
          </p>
        </blockquote>

        {/* The traction ladder */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            The traction ladder
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            Traction builds in stages. Each level is more convincing than
            the last:
          </p>
          <div className="mt-6 space-y-4">
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              <strong className="text-black/70">Level 1: Problem validation.</strong>{" "}
              You&apos;ve talked to 20+ people who have the problem. They
              describe it the same way. They&apos;ve tried other solutions
              and are unsatisfied. You haven&apos;t built anything yet.
              This is enough to start.
            </p>
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              <strong className="text-black/70">Level 2: Letters of intent.</strong>{" "}
              Companies or people have written down that they&apos;d pay for
              a solution. Not a verbal &ldquo;yeah, I&apos;d probably buy
              that.&rdquo; A signed letter. This is pre-product traction.
            </p>
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              <strong className="text-black/70">Level 3: Design partners.</strong>{" "}
              Real companies are working with you to build the product.
              They&apos;re giving you time, access, and feedback. This
              proves the problem is painful enough that someone will invest
              effort to solve it.
            </p>
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              <strong className="text-black/70">Level 4: Pilots.</strong>{" "}
              Customers are using the product in production. Real data,
              real workflows, real users. The product is being tested
              against reality, not theory.
            </p>
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              <strong className="text-black/70">Level 5: Revenue.</strong>{" "}
              Someone paid you. Not a friend, not your mom. A stranger
              evaluated your product against alternatives and chose to
              give you money. This is the strongest signal of all.
            </p>
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              <strong className="text-black/70">Level 6: Retention.</strong>{" "}
              They came back. They renewed. They expanded. Revenue proves
              someone will buy. Retention proves you&apos;ve built something
              they can&apos;t live without.
            </p>
          </div>
        </section>

        {/* Traction before fundraising */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Traction before fundraising
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            Most founders get this backwards.{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              They try to raise money to get traction, when they should be
              getting traction to raise money.
            </span>
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            Here&apos;s the reality: at pre-seed, investors are betting on
            the team and the market. Some traction helps, but it&apos;s not
            required. At seed, you need to show that the product works and
            people want it. 3&ndash;5 design partners, a few paying customers,
            or a clear growth trend.{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              By Series A, traction is non-negotiable.
            </span>{" "}
            You need $1M+ ARR, clear product-market fit signals, and a
            growth rate that proves the market is pulling the product
            forward.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            Every week of traction you build before fundraising improves
            your terms. It raises your valuation, reduces your dilution,
            and gives you leverage in negotiations. The founder with $10K
            MRR doesn&apos;t need to take the first term sheet offered.
            The founder with zero revenue takes whatever they can get.
          </p>
        </section>

        {/* What counts as traction for investors */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            What investors actually consider traction
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            Different metrics matter at different stages. Here&apos;s what
            moves the needle:
          </p>
          <div className="mt-6 space-y-4">
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              <strong className="text-black/70">Revenue growth rate</strong>{" "}
              &mdash; not absolute revenue. $2K MRR growing 30% month over
              month is more impressive than $50K MRR that&apos;s been flat
              for six months. Growth rate shows trajectory.
            </p>
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              <strong className="text-black/70">Retention and engagement</strong>{" "}
              &mdash; are users coming back? Daily active users divided by
              monthly active users tells you how sticky the product is.
              Above 40% is strong. Below 20% means people try it and forget it.
            </p>
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              <strong className="text-black/70">Paying customers over free users</strong>{" "}
              &mdash; five paying customers beats 5,000 free signups every
              time. Payment is the ultimate filter for intent.
            </p>
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              <strong className="text-black/70">Enterprise logos</strong>{" "}
              &mdash; one recognizable company using your product gives
              investors confidence. It signals that a real procurement
              process evaluated you and said yes.
            </p>
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              <strong className="text-black/70">Organic growth</strong>{" "}
              &mdash; users finding you without paid marketing. Word of
              mouth, referrals, inbound search. This is the strongest
              signal of product-market fit: the product sells itself.
            </p>
          </div>
        </section>

        {/* How to get your first customers */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Getting your first 10 customers
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            The first 10 customers don&apos;t come from marketing. They
            come from you, personally, doing things that don&apos;t scale.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              Cold outreach to people who have the problem.
            </span>{" "}
            Not a mass email blast. Individual, personalized messages to
            people you&apos;ve identified as having the exact pain point
            you solve. LinkedIn, Twitter DMs, introductions through your
            network. You need 100 conversations to get 10 customers.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              Communities where your customers hang out.
            </span>{" "}
            Slack groups, Discord servers, Reddit, industry forums, Twitter
            circles. Don&apos;t spam your product link. Be helpful. Answer
            questions. Become known as the person who understands the
            problem. The product comes up naturally.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              Your own network.
            </span>{" "}
            Former colleagues, classmates, conference contacts. Not asking
            them to buy &mdash; asking them to introduce you to someone
            who has the problem. One warm introduction is worth 50 cold
            emails.
          </p>
        </section>

        {/* Pull quote */}
        <blockquote className="border-l-[3px] border-black pl-8">
          <p className="text-[24px] font-light leading-[1.6] tracking-[-0.01em] text-black/80 italic">
            The first 10 customers are the hardest you&apos;ll ever get
            and the most important you&apos;ll ever have. They define
            your product, your positioning, and your future.
          </p>
        </blockquote>

        {/* Metrics that matter */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            The only metrics that matter early on
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            Early-stage founders drown in dashboards. Ignore most of them.
            Track three things:
          </p>
          <div className="mt-6 space-y-4">
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              <strong className="text-black/70">Are people using it?</strong>{" "}
              Not signing up. Using it. Coming back. If your day-7 retention
              is below 10%, the product isn&apos;t solving a real problem.
              Fix this before anything else.
            </p>
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              <strong className="text-black/70">Will they pay for it?</strong>{" "}
              The moment you can charge money and someone says yes, you
              have a business. The moment they renew, you have traction.
            </p>
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              <strong className="text-black/70">Will they tell others?</strong>{" "}
              Word of mouth is free acquisition and the strongest signal
              of product-market fit. If your users refer others without
              being asked, you&apos;re on the right path.
            </p>
          </div>
          <p className="mt-6 text-[18px] leading-[2] text-black/55">
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              Everything else &mdash; pageviews, app downloads, social
              followers, press mentions &mdash; is noise until these
              three questions have good answers.
            </span>
          </p>
        </section>

        {/* Mistakes */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Common traction mistakes
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
          href="/money/fundraising"
          className="inline-flex items-center gap-2.5 border border-black bg-black px-6 py-3.5 text-[15px] font-medium text-white transition-colors hover:bg-black/90"
        >
          Next: Fundraising
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </div>
    </article>
  );
}
