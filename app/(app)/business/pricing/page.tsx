"use client";

import Link from "next/link";

// ── Keywords ──

const KEYWORDS: { term: string; explanation: string }[] = [
  {
    term: "Freemium",
    explanation: "Give the product away for free, charge for premium features. Works when your free tier is genuinely useful and your paid tier is genuinely necessary. If nobody upgrades, your free tier is too good. If nobody signs up, your free tier isn\u2019t good enough.",
  },
  {
    term: "Usage-Based Pricing",
    explanation: "Charge based on consumption \u2014 API calls, storage, seats, messages sent. Aligns cost with value: customers who use more, pay more. The downside is unpredictable revenue and customers who are afraid to use the product because it costs money every time they do.",
  },
  {
    term: "Flat-Rate Pricing",
    explanation: "One price, one plan, everything included. The simplest model to communicate and the easiest to buy. Works well when your product does one thing and does it well. Falls apart when customers have wildly different needs.",
  },
  {
    term: "Per-Seat Pricing",
    explanation: "Charge per user. The default for most B2B SaaS. Easy to understand, scales with the customer\u2019s organization. The problem: it incentivizes customers to share logins and penalizes them for adding teammates. You\u2019re taxing collaboration.",
  },
  {
    term: "Value Metric",
    explanation: "The unit you charge for. The best value metrics grow as your customer gets more value from the product. Seats, API calls, revenue processed, projects created. Choose one that customers understand and that correlates with the value they receive.",
  },
  {
    term: "Price Anchoring",
    explanation: "Putting an expensive option next to the one you want people to buy, making it look like a deal. The \u201CEnterprise\u201D tier at $499/mo makes the $79/mo Pro tier feel reasonable. This isn\u2019t manipulation \u2014 it\u2019s framing. Every SaaS pricing page does it.",
  },
  {
    term: "Annual Discount",
    explanation: "Offering a lower effective monthly price for paying upfront. Typically 15\u201320% off. You get cash upfront, reduced churn (people who prepay are committed), and more predictable revenue. The customer gets a discount. Everyone wins.",
  },
  {
    term: "Willingness to Pay (WTP)",
    explanation: "The maximum amount a customer would pay before walking away. You find this by asking, not guessing. \u201CAt what price would this be too expensive to consider?\u201D \u201CAt what price would this be so cheap you\u2019d question the quality?\u201D The answer is your pricing range.",
  },
  {
    term: "ARPU",
    explanation: "Average Revenue Per User. Total revenue divided by total customers. The number investors will ask about right after MRR. A high ARPU means you can afford expensive acquisition channels. A low ARPU means you need volume or virality.",
  },
  {
    term: "Net Revenue Retention (NRR)",
    explanation: "How much revenue you keep and expand from existing customers, excluding new sales. Above 100% means existing customers are spending more over time \u2014 through upgrades, expansion, or usage growth. The best SaaS companies are above 120%. Below 100% means you\u2019re leaking.",
  },
];

const MISTAKES = [
  "Pricing based on what it costs you instead of what it\u2019s worth to the customer. Your server costs are irrelevant. The customer is paying for the outcome, not the infrastructure.",
  "Launching with \u201Cwe\u2019ll figure out pricing later.\u201D Later never comes, and free users don\u2019t convert into paying users \u2014 they convert into people who expect everything to be free.",
  "Copying a competitor\u2019s pricing without understanding their cost structure or customer base. Their $29/mo plan works because they have 50,000 customers and a different cost of acquisition.",
  "Having too many tiers. Three is almost always the right number. Free, Pro, Enterprise. Or Starter, Growth, Scale. If you need a comparison table to explain the differences, you have too many options.",
  "Never raising prices. Your product is better than it was a year ago. Your costs are higher. Your customers are getting more value. Raise your prices. Grandfather existing customers if you want, but new customers should pay what the product is worth today.",
  "Hiding your pricing. If someone has to \u201Ccontact sales\u201D to find out how much it costs, they\u2019ll just go to a competitor who shows their pricing. Transparency builds trust. The only exception is true enterprise deals with custom scoping.",
  "Offering unlimited everything on every plan. If there\u2019s no difference between plans, there\u2019s no reason to upgrade. Limits aren\u2019t punitive \u2014 they\u2019re how you segment customers by the value they receive.",
  "Discounting too aggressively to close deals. Every discount trains the market to wait for a sale. Your price is your price. If nobody will pay it, the price is wrong \u2014 fix it for everyone, don\u2019t negotiate one-offs.",
];

// ── Page ──

export default function PricingPage() {
  return (
    <article className="mx-auto max-w-[680px] px-6 py-16 md:py-24">
      {/* Title */}
      <header>
        <h1 className="font-heading text-[clamp(2.5rem,6vw,3.5rem)] italic font-extralight leading-[1.1] tracking-[-0.03em] text-black">
          Pricing Strategy
        </h1>
        <div className="mt-8 flex items-center gap-3 text-[13px] text-black/40">
          <span>10 min read</span>
        </div>
      </header>

      {/* Opening — large lede */}
      <p className="mt-14 text-[22px] leading-[1.75] text-black/70 font-light">
        Pricing is the most underleveraged growth tool in your company. Most
        founders spend months on product and minutes on pricing. Then they
        pick a number that &ldquo;feels right,&rdquo; put it on a landing
        page, and never think about it again. That number is almost
        certainly wrong.
      </p>

      {/* Sections */}
      <div className="mt-16 space-y-12">
        {/* Why pricing matters */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Why pricing matters more than you think
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            A 1% improvement in pricing has a bigger impact on profit than a
            1% improvement in customer acquisition or a 1% reduction in costs.
            This isn&apos;t theory &mdash;{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              it&apos;s been studied across thousands of companies.
            </span>{" "}
            Pricing is the most direct lever you have on revenue, and it&apos;s
            the one most founders ignore.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            Bad pricing doesn&apos;t just leave money on the table. It sends
            the wrong signal. Price too low and customers assume the product
            is amateur. Price too high and they don&apos;t even try it.{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              Your price is a statement about who the product is for and how
              seriously you take it.
            </span>
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            The good news: pricing is not permanent. You can change it. You
            should change it. The founders who treat pricing as an ongoing
            experiment outperform those who set it once and forget it.
          </p>
        </section>

        {/* Pull quote */}
        <blockquote className="border-l-[3px] border-black pl-8">
          <p className="text-[24px] font-light leading-[1.6] tracking-[-0.01em] text-black/80 italic">
            Your price is not what it costs you to deliver.
            It&apos;s what the outcome is worth to the customer.
          </p>
        </blockquote>

        {/* Cost-plus vs value-based */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Cost-plus vs. value-based pricing
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            Cost-plus pricing means you calculate what it costs to deliver
            the product, add a margin, and that&apos;s your price. It&apos;s
            simple, intuitive, and almost always wrong for software.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            Your marginal cost of serving one more customer is close to zero.
            If your server costs $200/month and you have 1,000 customers, your
            cost per customer is 20 cents. Pricing based on that number means
            charging $1/month. But if your product saves each customer 10
            hours a week, it&apos;s worth far more than a dollar.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              Value-based pricing starts with the customer, not the spreadsheet.
            </span>{" "}
            What problem are you solving? How much does that problem cost them
            today? How much time, money, or pain does your product eliminate?
            Price at a fraction of that value and the customer feels like
            they&apos;re getting a deal &mdash; because they are.
          </p>
        </section>

        {/* Choosing a model */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Choosing a pricing model
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            There is no universally correct pricing model. The right one
            depends on how your customers get value from your product.
          </p>

          <div className="mt-8 space-y-8">
            <div>
              <p className="text-[20px] font-medium leading-[1.4] text-black">
                Flat rate
              </p>
              <p className="mt-2 text-[17px] leading-[1.9] text-black/50">
                One price, one plan. Basecamp charges $299/month for everything,
                unlimited users. It&apos;s radical simplicity. No comparison
                tables, no upgrade prompts, no friction. Works when your
                product is opinionated about who it&apos;s for and refuses
                to be everything to everyone.
              </p>
            </div>

            <div>
              <p className="text-[20px] font-medium leading-[1.4] text-black">
                Tiered pricing
              </p>
              <p className="mt-2 text-[17px] leading-[1.9] text-black/50">
                The SaaS default. Three tiers: a cheap one to get people in
                the door, a mid-tier that most people buy, and an expensive
                one that makes the mid-tier look reasonable. The structure
                works because different customers have different needs and
                different budgets. The trick is making the tiers genuinely
                different &mdash; not just the same product with artificial
                limits.
              </p>
            </div>

            <div>
              <p className="text-[20px] font-medium leading-[1.4] text-black">
                Per-seat
              </p>
              <p className="mt-2 text-[17px] leading-[1.9] text-black/50">
                Charge per user. Scales naturally with the customer&apos;s
                organization. Slack, Notion, Linear &mdash; they all do this.
                The hidden cost: you&apos;re creating an incentive for
                customers to share logins. And adding a new team member
                means going through procurement. You&apos;re taxing
                adoption of your own product.
              </p>
            </div>

            <div>
              <p className="text-[20px] font-medium leading-[1.4] text-black">
                Usage-based
              </p>
              <p className="mt-2 text-[17px] leading-[1.9] text-black/50">
                Charge for what they use. Stripe charges per transaction.
                AWS charges per compute hour. Twilio charges per message.
                This is the fairest model &mdash; customers pay in proportion
                to the value they receive. The trade-off is unpredictable
                bills and customers who are afraid to experiment because
                every click costs money.
              </p>
            </div>

            <div>
              <p className="text-[20px] font-medium leading-[1.4] text-black">
                Freemium
              </p>
              <p className="mt-2 text-[17px] leading-[1.9] text-black/50">
                Give it away, upsell later. Figma, Dropbox, Spotify. The
                free tier is your acquisition channel. It replaces paid
                marketing with product experience. But freemium only works
                if the free tier is useful enough to hook people and limited
                enough to make them want more. Most companies get one side
                of this wrong.
              </p>
            </div>
          </div>
        </section>

        {/* Finding the right price */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Finding the right price
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            Stop guessing. Talk to customers. Not &ldquo;would you pay for
            this?&rdquo; &mdash; everyone says yes to that question. Ask
            better questions:
          </p>
          <div className="mt-6 space-y-4">
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              &ldquo;At what price would this be so expensive you&apos;d
              never consider it?&rdquo;
            </p>
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              &ldquo;At what price would this be so cheap you&apos;d question
              the quality?&rdquo;
            </p>
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              &ldquo;At what price would this start to feel expensive but
              you&apos;d still buy it?&rdquo;
            </p>
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              &ldquo;At what price would this feel like a great deal?&rdquo;
            </p>
          </div>
          <p className="mt-6 text-[18px] leading-[2] text-black/55">
            This is the Van Westendorp method. Plot the answers and you get
            a pricing range. The overlap between &ldquo;too expensive&rdquo;
            and &ldquo;great deal&rdquo; is your sweet spot.{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              Ten customer interviews will tell you more about pricing than
              a month of spreadsheet modeling.
            </span>
          </p>
        </section>

        {/* Pull quote */}
        <blockquote className="border-l-[3px] border-black pl-8">
          <p className="text-[24px] font-light leading-[1.6] tracking-[-0.01em] text-black/80 italic">
            If nobody complains about your price, it&apos;s too low.
            If everyone complains, it&apos;s too high. If about 20%
            push back, you&apos;re in the right zone.
          </p>
        </blockquote>

        {/* The three-tier structure */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            The three-tier playbook
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            If you&apos;re doing tiered pricing, here&apos;s the structure
            that works for 90% of SaaS companies:
          </p>
          <div className="mt-6 space-y-4">
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              <strong className="text-black/70">Tier 1: The entry point.</strong>{" "}
              Low price, limited features. This is your acquisition tool. It
              gets people using the product and experiencing value. Price it
              low enough that the purchase decision is a no-brainer.
            </p>
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              <strong className="text-black/70">Tier 2: The sweet spot.</strong>{" "}
              This is where 60&ndash;70% of your customers should land. It has
              enough features that power users are happy, and it&apos;s priced
              to feel like great value compared to Tier 3. This is your
              money-maker.
            </p>
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              <strong className="text-black/70">Tier 3: The anchor.</strong>{" "}
              Expensive. Everything included. Custom features, dedicated
              support, SLAs. Most people won&apos;t buy this &mdash;
              that&apos;s the point. It makes Tier 2 look like a deal.
              The people who do buy it are enterprise customers with big
              budgets and specific needs.
            </p>
          </div>
        </section>

        {/* When to charge */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Charge from day one
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            &ldquo;We&apos;ll monetize later&rdquo; is the most dangerous
            sentence in startups.{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              Later never comes, and free users are not the same as paying
              customers.
            </span>{" "}
            Free users give you vanity metrics. Paying customers give you
            validation.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            The moment someone pays you, everything changes. Their feedback
            is more honest. Their engagement is deeper. Their expectations
            are clearer. And you learn something no amount of user interviews
            can teach you:{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              what the product is actually worth.
            </span>
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            If you&apos;re afraid to charge, ask yourself why. Usually
            it&apos;s because you&apos;re not confident the product is
            good enough. That&apos;s useful information. It means you need
            to make the product better, not that you need to give it away.
          </p>
        </section>

        {/* Raising prices */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Raise your prices
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            Almost every founder I&apos;ve met who raised their prices wished
            they had done it sooner. Here&apos;s what usually happens: you
            raise prices 50%, you lose 10% of customers, and your revenue
            goes up 35%.{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              The customers you lose were the ones who valued your product
              the least.
            </span>{" "}
            The ones who stay are better customers &mdash; less support,
            less churn, higher lifetime value.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            When you raise prices, grandfather existing customers if you
            want to maintain goodwill. But new customers pay the new price.
            Your product is better today than it was six months ago. Your
            price should reflect that.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            The rule of thumb:{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              if fewer than 20% of prospects push back on price, you&apos;re
              too cheap.
            </span>{" "}
            If more than 40% push back, you might be too expensive. Somewhere
            in between is the right zone &mdash; enough resistance to know
            you&apos;re capturing real value, not so much that you&apos;re
            losing deals.
          </p>
        </section>

        {/* Discounting */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            The discount trap
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            Every discount you offer trains the market to expect discounts.{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              Once you start discounting, you can never stop.
            </span>{" "}
            Customers will wait for sales. Prospects will negotiate harder.
            Your listed price becomes a fiction.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            The only discount that makes sense is an annual prepayment
            discount. The customer gets a lower monthly rate; you get cash
            upfront and lower churn. That&apos;s a fair trade. Everything
            else &mdash; launch discounts, holiday sales, &ldquo;I&apos;ll
            throw in a discount to close the deal&rdquo; &mdash; erodes
            your pricing power and attracts the wrong customers.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            If someone won&apos;t pay your price, the answer isn&apos;t
            a discount. It&apos;s either a smaller plan that fits their
            budget or the honest conclusion that they&apos;re not your
            customer.
          </p>
        </section>

        {/* B2B vs B2C */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            B2B vs. B2C pricing
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            B2C customers pay with their own money. They&apos;re price-sensitive,
            they comparison shop, and they expect free alternatives to exist.
            Your price needs to be low enough to be an impulse decision or
            high enough to feel premium. The middle ground is death.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            B2B customers pay with someone else&apos;s money.{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              They care about ROI, not the absolute price.
            </span>{" "}
            If your product saves a company $100,000 a year, charging $10,000
            is a 10x return. Nobody gets fired for approving that purchase.
            B2B pricing should be anchored to the business outcome, not the
            consumer&apos;s gut feeling.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            The biggest mistake B2B founders make is pricing like B2C. You
            see it all the time &mdash; enterprise software at $9/month because
            the founder was afraid to charge more. The enterprise customer
            doesn&apos;t trust a $9/month product with their data. They
            think it&apos;s a toy.
          </p>
        </section>

        {/* Pull quote */}
        <blockquote className="border-l-[3px] border-black pl-8">
          <p className="text-[24px] font-light leading-[1.6] tracking-[-0.01em] text-black/80 italic">
            The best pricing feels expensive enough to be taken seriously
            and cheap enough to be a no-brainer given the value.
          </p>
        </blockquote>

        {/* Pricing page design */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Your pricing page is a sales page
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            Your pricing page gets more traffic than you think. It&apos;s
            one of the first pages prospects visit after the homepage. And
            most pricing pages are terrible &mdash; a confusing table of
            features with checkmarks and X&apos;s that nobody reads.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            A good pricing page does three things:{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              makes the decision easy, highlights the recommended plan,
              and answers objections before they form.
            </span>{" "}
            Name your tiers clearly. Don&apos;t call them &ldquo;Silver,
            Gold, Platinum&rdquo; &mdash; call them &ldquo;Starter, Growth,
            Scale&rdquo; so customers self-select based on where they are.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            Put an FAQ below the plans. &ldquo;Can I change plans later?&rdquo;
            &ldquo;What happens if I exceed the limit?&rdquo; &ldquo;Do you
            offer refunds?&rdquo; Every unanswered question is a reason to
            leave without buying.
          </p>
        </section>

        {/* Metrics */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Pricing metrics that matter
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            Once you have paying customers, track these numbers religiously:
          </p>
          <div className="mt-6 space-y-4">
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              <strong className="text-black/70">ARPU</strong> &mdash; Average
              revenue per user. Is it going up or down? Up means your product
              is getting more valuable or your pricing is improving. Down
              means you&apos;re attracting cheaper customers or your mix is
              shifting.
            </p>
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              <strong className="text-black/70">Net Revenue Retention</strong>{" "}
              &mdash; Are existing customers spending more over time? Above
              100% is the holy grail. It means you grow even without new
              customers.
            </p>
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              <strong className="text-black/70">Conversion rate by tier</strong>{" "}
              &mdash; If nobody picks Tier 3, it&apos;s either too expensive
              or not differentiated enough. If everyone picks Tier 1, your
              mid-tier isn&apos;t compelling.
            </p>
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              <strong className="text-black/70">Upgrade rate</strong> &mdash;
              How many customers move from a lower tier to a higher one?
              This tells you if your product naturally expands within accounts.
              If nobody upgrades, your tiers aren&apos;t aligned with how
              customers grow.
            </p>
          </div>
        </section>

        {/* Mistakes */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Common pricing mistakes
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
          href="/business/gtm"
          className="inline-flex items-center gap-2.5 border border-black bg-black px-6 py-3.5 text-[15px] font-medium text-white transition-colors hover:bg-black/90"
        >
          Plan your go-to-market
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </div>
    </article>
  );
}
