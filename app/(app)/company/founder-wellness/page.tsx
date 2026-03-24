"use client";

import Link from "next/link";

// ── Content ──

const BURNOUT_SIGNS = [
  "You dread opening your laptop in the morning. Not sometimes \u2014 every day.",
  "You can\u2019t remember the last time you did something that wasn\u2019t work.",
  "Small problems feel catastrophic. A bug report makes you want to quit.",
  "You\u2019re irritable with everyone \u2014 your co-founder, your partner, your dog.",
  "You\u2019re working more hours but getting less done. Motion without progress.",
  "You\u2019ve stopped caring about the thing you used to be obsessed with.",
  "You\u2019re self-medicating. Alcohol, weed, doomscrolling, whatever numbs it.",
  "You check your phone the second you wake up. Not for messages \u2014 for fires.",
  "You fantasize about getting a normal job. Not because you want one, but because you want the pain to stop.",
];

const WELLNESS_MISTAKES = [
  "Thinking you\u2019ll rest \u201Cafter the launch.\u201D There\u2019s always another launch. Rest is not a reward. It\u2019s maintenance.",
  "Comparing your chapter 1 to someone else\u2019s chapter 10. The founder posting wins on X didn\u2019t show you the two years of silence before it.",
  "Saying yes to everything because you\u2019re afraid of missing an opportunity. The opportunities you say no to define you more than the ones you take.",
  "Hiding the struggle. Telling investors \u201Ceverything\u2019s great\u201D when it\u2019s not. Telling your partner \u201CI\u2019m fine\u201D when you\u2019re not. The people who can help you can\u2019t help if they don\u2019t know.",
  "Believing that suffering equals progress. Working 18 hours doesn\u2019t mean you moved the needle. It means you were busy. Those are different things.",
  "Waiting until you break to ask for help. The time to build a support system is before you need it, not during the crisis.",
  "Sacrificing sleep. You\u2019re not more productive on 5 hours. You\u2019re making worse decisions faster. Sleep is the highest-leverage activity you\u2019re not doing.",
  "Ignoring physical symptoms. That chest tightness, the headaches, the stomach problems \u2014 your body is keeping score even when your mind won\u2019t.",
];

const WHAT_HELPS = [
  "Talk to other founders. Not mentors, not advisors \u2014 founders. People in the exact same situation. They\u2019re the only ones who truly get it. Find a group of 3\u20134 and meet regularly. This alone will save you.",
  "Exercise. Not because it\u2019s a productivity hack. Because your body is absorbing the stress your mind won\u2019t process. Move it or it stays. A 30-minute walk beats a 3-hour therapy session some days.",
  "Set a hard stop. Pick a time and close the laptop. The company will survive one evening without you. It will not survive you burning out. Your best ideas will come in the shower, not at 2am staring at a screen.",
  "See a therapist. Not because you\u2019re broken. Because you\u2019re doing something extremely hard and you need a space to be honest about how it feels. A good therapist is cheaper than the decisions you\u2019ll make while falling apart.",
  "Take a real vacation. Not \u201Cworking from a beach.\u201D Actually off. 48 hours minimum. The anxiety of disconnecting will peak on hour 6 and fade by hour 24. When you come back, you\u2019ll see your problems more clearly than you have in months.",
  "Say no to things. Every coffee chat, podcast invite, and networking event you say yes to is time you\u2019re not spending on the three things that matter. Protect your calendar like you protect your equity.",
  "Write it down. Not for anyone else. For you. The thoughts spinning in your head at 3am lose their power when they\u2019re on paper. Keep a journal. It doesn\u2019t need to be good. It needs to exist.",
  "Celebrate small wins. You closed a customer. You shipped a feature. You survived another week. These are real. The dopamine of a big exit is years away. You need fuel now.",
];

const HARD_QUESTIONS = [
  "Am I persisting because the data says I should, or because I\u2019m afraid to admit it\u2019s not working?",
  "Am I building this for my customers or for my ego?",
  "If I started over today with everything I know, would I build the same thing?",
  "Am I sacrificing my health for a company that might not exist in two years?",
  "When was the last time I was genuinely happy \u2014 not relieved, not proud, happy?",
  "If this fails, will I regret the time I spent or how I spent it?",
  "Am I avoiding a hard conversation that would change everything?",
  "Who am I when I\u2019m not \u201Cthe founder\u201D? Do I still know?",
];

// ── Page ──

export default function FounderWellnessPage() {
  return (
    <article className="mx-auto max-w-[680px] px-6 py-16 md:py-24">
      {/* Title */}
      <header>
        <h1 className="font-heading text-[clamp(2.5rem,6vw,3.5rem)] italic font-extralight leading-[1.1] tracking-[-0.03em] text-black">
          Founder Wellness
        </h1>
        <div className="mt-8 flex items-center gap-3 text-[13px] text-black/40">
          <span>8 min read</span>
        </div>
      </header>

      {/* Opening */}
      <p className="mt-14 text-[22px] leading-[1.75] text-black/70 font-light">
        Nobody talks about this part. The pitch decks are polished.
        The launch tweets are optimistic. Behind the scenes, most founders
        are exhausted, anxious, lonely, and pretending they&apos;re fine.
        This page exists because we&apos;ve been there.
      </p>

      <div className="mt-16 space-y-12">
        {/* The reality */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            The reality nobody posts about
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            Here&apos;s what the LinkedIn posts won&apos;t tell you.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              72% of founders report mental health challenges.
            </span>{" "}
            Depression rates among founders are 2x the general population.
            Anxiety, insomnia, substance abuse &mdash; all significantly higher.
            This isn&apos;t because founders are weaker. It&apos;s because
            the job is genuinely, structurally harder on your mental health
            than almost anything else you could do.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            You&apos;re making high-stakes decisions with incomplete information,
            every day, with no safety net, while pretending to everyone &mdash;
            investors, employees, customers, your family &mdash; that you
            have it figured out.{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              Of course that takes a toll.
            </span>
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            The founders who make it aren&apos;t the ones who don&apos;t struggle.
            They&apos;re the ones who struggle and deal with it instead of
            burying it under more work.
          </p>
        </section>

        {/* The loneliness */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            The loneliness is real
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            Your friends won&apos;t understand why you&apos;re doing this. Your
            family will worry. Your partner will wonder when things go back
            to normal. The answer is they don&apos;t. This is the new normal.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            You&apos;ll sit in a room full of people and feel completely alone.
            You&apos;ll have a great day &mdash; a customer signs, a feature ships &mdash;
            and have nobody to tell who really understands why it matters.
            You&apos;ll have a terrible day and have nobody to tell at all,
            because admitting it feels like weakness.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              Loneliness isn&apos;t a sign that something is wrong.
              It&apos;s a side effect of doing something most people won&apos;t.
            </span>{" "}
            But it needs to be managed, not ignored. Ignored loneliness
            becomes isolation. Isolation becomes bad decisions. Bad decisions
            become a failed company. The chain is shorter than you think.
          </p>
        </section>

        {/* Imposter syndrome */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Imposter syndrome
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            You will feel like a fraud. Every founder does. The ones
            raising millions feel it. The ones with thousands of users
            feel it. The ones on magazine covers feel it.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            You&apos;ll pitch investors and feel like you&apos;re lying. You&apos;ll
            hire someone and wonder why they&apos;re trusting you. You&apos;ll
            read about a competitor and think &ldquo;they clearly know
            what they&apos;re doing and I don&apos;t.&rdquo; They feel the
            same way about you.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            It never goes away. You just get better at recognizing it for
            what it is:{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              your brain trying to protect you from the risk of being visible.
            </span>{" "}
            Thank it and keep going.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            The opposite of imposter syndrome is Dunning-Kruger &mdash;
            the people who are too incompetent to know they&apos;re
            incompetent. The fact that you feel uncertain means you&apos;re
            aware of how much you don&apos;t know.{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              That awareness is a feature, not a bug.
            </span>{" "}
            It keeps you learning.
          </p>
        </section>

        {/* Pull quote */}
        <blockquote className="border-l-[3px] border-black pl-8">
          <p className="text-[24px] font-light leading-[1.6] tracking-[-0.01em] text-black/80 italic">
            You can&apos;t pour from an empty cup.
            A burned-out founder builds a burned-out company.
          </p>
        </blockquote>

        {/* Burnout */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Burnout is not a badge of honor
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            Startup culture glorifies suffering. 18-hour days. Sleeping
            at the office. &ldquo;I&apos;ll rest when I&apos;m dead.&rdquo;
            This is not heroic. It&apos;s unsustainable and it produces
            terrible decisions.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            The founder who works 14 hours a day and makes one critical
            mistake in hour 13 has done more damage than the founder who
            worked 8 focused hours and went home. Startups don&apos;t die from
            lack of effort. They die from bad judgment. And bad judgment
            is what you get when you&apos;re exhausted.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              Burnout doesn&apos;t announce itself. It accumulates.
            </span>{" "}
            By the time you recognize it, you&apos;ve been making bad
            decisions for weeks. Signs to watch for:
          </p>
          <div className="mt-6 space-y-4">
            {BURNOUT_SIGNS.map((s, i) => (
              <p key={i} className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
                {s}
              </p>
            ))}
          </div>
          <p className="mt-6 text-[18px] leading-[2] text-black/55">
            If you recognized yourself in three or more of those,
            stop reading and go outside. Seriously. This page will be
            here when you get back.
          </p>
        </section>

        {/* The comparison trap */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            The comparison trap
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            Someone you know just raised $5M. Someone else just hit $1M ARR.
            Someone who started after you is already further ahead.
            It feels personal. It feels like proof that you&apos;re failing.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            It&apos;s not. You&apos;re comparing your behind-the-scenes to
            everyone else&apos;s highlight reel.{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              The founder who raised $5M might be three months from running
              out of money. The one at $1M ARR might be losing $200K a month.
            </span>{" "}
            You don&apos;t know. Nobody posts the down rounds, the layoffs,
            the 3am panic attacks.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            The only comparison that matters: are you further than you were
            last month? If yes, keep going. If no, figure out why. That&apos;s it.
            Everyone else&apos;s timeline is irrelevant to yours.
          </p>
        </section>

        {/* Second pull quote */}
        <blockquote className="border-l-[3px] border-black pl-8">
          <p className="text-[24px] font-light leading-[1.6] tracking-[-0.01em] text-black/80 italic">
            The goal is not to avoid the hard days.
            The goal is to still be standing after them.
          </p>
        </blockquote>

        {/* Persistence vs stubbornness */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Persistence vs. stubbornness
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            There&apos;s a thin line between the founder who pushes through
            adversity and the founder who refuses to accept reality.
            Everyone celebrates the first. Nobody talks about the second
            until it&apos;s too late.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              Persistence is adapting your approach when the data says
              your current one isn&apos;t working.
            </span>{" "}
            Stubbornness is doing the same thing and expecting different
            results because you&apos;ve invested too much to change course.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            Sunk cost kills startups. The money you&apos;ve spent, the
            time you&apos;ve invested, the identity you&apos;ve built around
            being &ldquo;the founder of X&rdquo; &mdash; none of that is a
            reason to keep going if the market is telling you to stop.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            Knowing when to quit is not weakness.{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              It takes more courage to admit something isn&apos;t working
              than to keep grinding out of obligation.
            </span>{" "}
            The best founders know the difference between a setback and
            a dead end. Setbacks you push through. Dead ends you walk
            away from &mdash; and take everything you learned to the next thing.
          </p>
        </section>

        {/* Mistakes */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Mistakes that destroy founders
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            These aren&apos;t business mistakes. These are the personal ones
            that take founders out of the game &mdash; not because the company
            failed, but because they did.
          </p>
          <div className="mt-6 space-y-4">
            {WELLNESS_MISTAKES.map((m, i) => (
              <p key={i} className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
                {m}
              </p>
            ))}
          </div>
        </section>

        {/* What helps */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            What actually helps
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            Not productivity hacks. Not morning routines. Not cold plunges.
            Not another self-help book. The things that actually keep
            founders alive and functioning:
          </p>
          <div className="mt-6 space-y-4">
            {WHAT_HELPS.map((s, i) => (
              <p key={i} className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
                {s}
              </p>
            ))}
          </div>
        </section>

        {/* Your identity is not your startup */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            You are not your startup
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            This is the hardest one.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            When you pour everything into your company, it becomes your
            identity. Your Twitter bio says founder. Your conversations
            revolve around it. Your self-worth rises and falls with your
            MRR. A bad quarter feels like a personal failure. A lost
            customer feels like rejection. A competitor&apos;s success
            feels like your failure.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            This is dangerous because when the company struggles &mdash;
            and it will &mdash; you won&apos;t just feel like your business
            is failing. You&apos;ll feel like{" "}
            <span className="italic">you</span> are failing. As a person.
            That&apos;s when founders make desperate decisions, take bad deals,
            or burn out completely.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              Your company might fail. You won&apos;t.
            </span>{" "}
            The skills you&apos;re building, the resilience you&apos;re
            developing, the clarity you&apos;re gaining &mdash; those follow
            you regardless. Most successful founders failed at least once
            before they got it right. Many failed two or three times.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            Build your company like your life depends on it.
            But remember that it doesn&apos;t.
          </p>
        </section>

        {/* Relationships */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Protect your relationships
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            Your startup will end. Maybe in 2 years, maybe in 10.
            Maybe in success, maybe not. Your relationships don&apos;t
            have to end with it.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            The founders who burn every relationship to build their company
            end up with a company and nobody to share it with. Or worse &mdash;
            no company and nobody to lean on.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              The number one regret of failed founders isn&apos;t the business.
              It&apos;s the relationships they lost along the way.
            </span>{" "}
            The partner who left. The friend who stopped calling. The parent
            whose calls they kept sending to voicemail.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            Schedule time for the people who matter. Not when you have
            time &mdash; you&apos;ll never have time. Schedule it like a
            board meeting. Because the people who stay with you through
            the startup are the people who&apos;ll be there after it.
            Don&apos;t take them for granted.
          </p>
        </section>

        {/* The long game */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            This is a long game
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            The average time to a startup exit is 7&ndash;10 years.
            That&apos;s not a sprint. That&apos;s a decade of your life.
            You cannot run a decade at sprint pace.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              The founders who win aren&apos;t the ones who work the hardest
              in month one. They&apos;re the ones who are still working in year five.
            </span>{" "}
            That requires pacing. It requires rest. It requires having a life
            outside the company so that the company doesn&apos;t consume
            everything you are.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            Take care of yourself not because it&apos;s nice to do, but because
            your company literally depends on it. You are the single point of
            failure. If you go down, everything goes down. Treat your health
            &mdash; mental, physical, emotional &mdash; like the most critical
            infrastructure in your company. Because it is.
          </p>
        </section>
      </div>

      {/* Separator */}
      <div className="my-20 flex justify-center gap-1.5">
        <span className="h-[3px] w-[3px] bg-black/25" />
        <span className="h-[3px] w-[3px] bg-black/25" />
        <span className="h-[3px] w-[3px] bg-black/25" />
      </div>

      {/* Hard questions */}
      <h2 className="text-[13px] font-medium uppercase tracking-[0.15em] text-black/30">
        Questions to sit with
      </h2>

      <div className="mt-8 space-y-5">
        {HARD_QUESTIONS.map((q, i) => (
          <p key={i} className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
            {q}
          </p>
        ))}
      </div>

      <p className="mt-8 text-[15px] leading-[1.8] text-black/40">
        You don&apos;t need to answer these out loud. But you need to be
        honest with yourself. The founders who last aren&apos;t the ones
        who never doubt. They&apos;re the ones who doubt clearly &mdash;
        and keep going anyway, with their eyes open.
      </p>

      {/* CTA */}
      <div className="mt-16 pb-8">
        <Link
          href="/company/ideation"
          className="inline-flex items-center gap-2.5 border border-black bg-black px-6 py-3.5 text-[15px] font-medium text-white transition-colors hover:bg-black/90"
        >
          Start building your idea
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </div>
    </article>
  );
}
