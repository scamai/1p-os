"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

interface Lesson {
  term: string;
  explanation: string;
}

interface PageEducation {
  title: string;
  items: Lesson[];
}

const EDUCATION: Record<string, PageEducation> = {
  "/company/founders": {
    title: "New to co-founding? Here's what you need to know",
    items: [
      { term: "Vesting", explanation: "You don't get all your equity at once. It 'vests' over time (usually 4 years) so if a co-founder leaves early, they don't walk away with a full share. This protects everyone." },
      { term: "Cliff", explanation: "A cliff is a waiting period (usually 12 months) before any equity vests. If someone leaves before the cliff, they get nothing. It's a trial period for the partnership." },
      { term: "Equity Split", explanation: "How you divide ownership among founders. There's no perfect formula — consider who had the idea, who's full-time, who's putting in capital, and who has the critical skills. Equal splits are common but not always fair." },
      { term: "Why this matters", explanation: "Co-founder disputes kill more startups than bad products. Get the equity and vesting right from day one. Put it in writing. A handshake deal will come back to haunt you." },
    ],
  },
  "/company/equity": {
    title: "Understanding equity and cap tables",
    items: [
      { term: "Cap Table", explanation: "A spreadsheet showing who owns what percentage of your company. Every investor, founder, and employee with equity appears here. Keep it clean — messy cap tables scare investors." },
      { term: "Dilution", explanation: "When you raise money, you issue new shares. This reduces (dilutes) everyone's ownership percentage. If you own 50% and raise a round, you might own 40% after. This is normal and expected." },
      { term: "ESOP / Option Pool", explanation: "A reserve of shares (usually 10-20%) set aside for future employees. VCs will often require you to create this before they invest, and it comes out of the founders' share." },
      { term: "Shares vs Percentage", explanation: "Think in shares, not percentages. If you have 1M shares out of 10M, you own 10%. After issuing 5M new shares to investors, you still have 1M shares but now own 6.67%. Your share count didn't change — the pie got bigger." },
    ],
  },
  "/company/incorporation": {
    title: "First time incorporating? Read this",
    items: [
      { term: "LLC vs C-Corp", explanation: "LLC is simpler and cheaper — good for freelancers and small businesses. C-Corp is required for VC funding. If you might raise money, go C-Corp from the start." },
      { term: "Delaware", explanation: "Most startups incorporate in Delaware even if they're based elsewhere. Delaware has business-friendly courts, predictable laws, and every VC lawyer knows Delaware law. It's the standard." },
      { term: "EIN", explanation: "Employer Identification Number — it's like a social security number for your company. Free from the IRS, takes 5 minutes online. You need it to open a bank account." },
      { term: "83(b) Election", explanation: "If you receive restricted stock, file this IRS form within 30 days. It lets you pay taxes on the stock's current (low) value instead of its future (hopefully high) value. Missing this deadline can cost you thousands." },
      { term: "Registered Agent", explanation: "A person or company designated to receive legal documents for your business. Required in most states. Costs about $100-300/year if you use a service." },
    ],
  },
  "/company/ideation": {
    title: "How to validate your startup idea",
    items: [
      { term: "Problem Statement", explanation: "The #1 reason startups fail is building something nobody wants. Start by clearly defining the problem you're solving. Talk to at least 20 potential customers before writing any code." },
      { term: "Target Customer", explanation: "Be specific. Not 'everyone' — but 'freelance designers making $50-150K who struggle with invoicing.' The narrower your initial target, the easier it is to build something they love." },
      { term: "Competitive Landscape", explanation: "If you think you have no competitors, you haven't looked hard enough. Competitors validate that the problem exists. Your job is to explain why your approach is 10x better for your specific audience." },
      { term: "MVP", explanation: "Minimum Viable Product — the smallest thing you can build to test if customers will pay. It should be embarrassingly simple. If you're not embarrassed by v1, you launched too late." },
    ],
  },
  "/company/solution-deck": {
    title: "What makes a great pitch deck",
    items: [
      { term: "The 10 Slides", explanation: "Most VCs expect: Problem, Solution, Market Size, Business Model, Traction, Team, Competition, Financials, The Ask, and Contact. Keep each slide to one idea." },
      { term: "Market Size (TAM/SAM/SOM)", explanation: "TAM = Total Addressable Market (everyone who could use this). SAM = Serviceable Available Market (your realistic target). SOM = Serviceable Obtainable Market (what you can actually capture in 2-3 years)." },
      { term: "Traction", explanation: "Evidence that people want what you're building. Revenue is best, but active users, waitlist signups, LOIs (letters of intent), or even customer interviews count at the early stage." },
      { term: "The Ask", explanation: "How much money you're raising, what you'll use it for, and how long it will last (runway). Be specific: '$500K to hire 2 engineers and reach $10K MRR in 12 months.'" },
    ],
  },
  "/company/accelerator": {
    title: "How accelerators work",
    items: [
      { term: "What's an Accelerator?", explanation: "A 3-6 month program that gives you money, mentorship, and a network in exchange for equity (usually 5-10%). The best programs dramatically increase your chances of success." },
      { term: "Equity", explanation: "The percentage of your company you give up. Top accelerators typically take 5-10% for $150K-500K. Some programs take 0%. Weigh the equity cost against the value of the network and brand." },
      { term: "Demo Day", explanation: "The final event where you pitch to hundreds of investors at once. A good demo day pitch can raise your entire seed round in a few weeks." },
      { term: "Batch", explanation: "Accelerators run in batches — groups of startups that go through the program together. Your batch-mates become your closest startup friends and support network." },
      { term: "When to Apply", explanation: "Apply as early as possible — even pre-product. Top accelerators have funded companies with just an idea and a strong team. The earlier you get in, the more the program helps." },
    ],
  },
  "/money/fundraising": {
    title: "Fundraising 101 for first-time founders",
    items: [
      { term: "Pre-seed vs Seed vs Series A", explanation: "Pre-seed ($50K-500K): idea stage, friends/family/angels. Seed ($500K-3M): early product, first customers. Series A ($5-15M): proven product-market fit, scaling." },
      { term: "Valuation", explanation: "What your company is 'worth.' At pre-seed, it's mostly made up. A $5M valuation means if an investor puts in $500K, they get 10%. Don't obsess over valuation — focus on getting funded." },
      { term: "SAFE", explanation: "Simple Agreement for Future Equity. The standard way to raise pre-seed/seed money. Not a loan, not equity yet — it converts to shares later when you do a priced round." },
      { term: "Lead Investor", explanation: "The first investor who commits and sets the terms. Once you have a lead, other investors follow. Finding a lead is the hardest part — everything gets easier after." },
      { term: "Runway", explanation: "How many months until you run out of money. If you have $300K and spend $25K/month, you have 12 months of runway. Always raise before you need to — start 6 months before you'd run out." },
    ],
  },
  "/legal/safes": {
    title: "Understanding SAFEs",
    items: [
      { term: "SAFE", explanation: "Simple Agreement for Future Equity — invented by Y Combinator. You give an investor money now, they get shares later when you raise a priced round. No interest, no maturity date, minimal legal fees." },
      { term: "Valuation Cap", explanation: "The maximum valuation at which the SAFE converts to equity. If the cap is $10M and you raise at $20M, the SAFE holder converts at $10M (getting twice as many shares). Lower cap = better deal for the investor." },
      { term: "Discount", explanation: "An alternative to a cap. If the discount is 20%, the SAFE holder gets shares at 20% less than what new investors pay. Some SAFEs have both a cap and discount — the investor gets whichever is better for them." },
      { term: "Post-money vs Pre-money SAFE", explanation: "Post-money SAFEs are simpler: if the cap is $10M and someone invests $1M, they own exactly 10%. Pre-money SAFEs are trickier because dilution math changes. Use post-money." },
      { term: "Pro Rata Rights", explanation: "The right for an investor to maintain their ownership percentage in future rounds by investing more. Standard in most SAFEs. It's a good thing — it means your early investors can keep backing you." },
    ],
  },
  "/money/runrate": {
    title: "What is runrate and why it matters",
    items: [
      { term: "Runrate", explanation: "Your current monthly revenue or spending extrapolated to a year. If you made $5K this month, your annual runrate is $60K. Investors use this to gauge trajectory." },
      { term: "Burn Rate", explanation: "How much money you spend per month. Gross burn is total spend. Net burn is spend minus revenue. If you spend $30K and make $10K, net burn is $20K/month." },
      { term: "MRR vs ARR", explanation: "Monthly Recurring Revenue (MRR) and Annual Recurring Revenue (ARR). ARR = MRR x 12. SaaS companies track MRR religiously — it's the heartbeat of the business." },
      { term: "Default Alive vs Default Dead", explanation: "Paul Graham's framework. If your revenue is growing and your expenses are flat, will you become profitable before running out of money? If yes, you're 'default alive.' If not, you need to either cut costs or raise money." },
    ],
  },
  "/money/bookkeeping": {
    title: "Bookkeeping basics for founders",
    items: [
      { term: "Why Bother?", explanation: "You need clean books to raise money, file taxes, and understand if you're actually making money. Start from day one — catching up later is painful and expensive." },
      { term: "Revenue vs Profit", explanation: "Revenue is what customers pay you. Profit is what's left after all expenses. You can have $100K in revenue and still be losing money if you spend $120K." },
      { term: "Accounts Receivable (AR)", explanation: "Money owed to you by customers. If you sent an invoice for $5K and haven't been paid yet, that's AR. Track it carefully — revenue means nothing if you can't collect." },
      { term: "Accounts Payable (AP)", explanation: "Money you owe to others — bills, vendor invoices, subscriptions. Pay on time to maintain good relationships and credit." },
    ],
  },
  "/money/tax": {
    title: "Taxes for startups — the basics",
    items: [
      { term: "Quarterly Estimated Taxes", explanation: "If you expect to owe more than $1K in taxes, you must pay estimated taxes quarterly (not just annually). Missing these deadlines means penalties." },
      { term: "C-Corp Taxes", explanation: "C-Corps pay corporate tax on profits (21% federal). Then if you pay yourself dividends, you're taxed again personally. This 'double taxation' is why early-stage startups rarely pay dividends." },
      { term: "R&D Tax Credit", explanation: "If you're building software, you likely qualify. The R&D credit can offset $250K+ of payroll taxes for startups. Ask your accountant about this — it's free money most founders miss." },
      { term: "State Nexus", explanation: "You owe state taxes wherever you have 'nexus' — employees, offices, or significant revenue. If you're a Delaware corp with employees in California, you file in both states." },
    ],
  },
  "/business/model": {
    title: "Choosing a business model",
    items: [
      { term: "SaaS (Software as a Service)", explanation: "Customers pay monthly/annually for access. Predictable revenue, high margins. Most VC-backed startups use this model. Example: Slack, Notion." },
      { term: "Marketplace", explanation: "Connect buyers and sellers, take a cut of each transaction. Hard to start (chicken-and-egg problem) but extremely valuable once you have network effects. Example: Airbnb, Uber." },
      { term: "Freemium", explanation: "Free basic tier, paid premium tier. Converts 2-5% of users typically. Good for products with viral potential. Example: Spotify, Zoom." },
      { term: "Usage-Based", explanation: "Charge based on consumption (API calls, storage, compute). Aligns cost with value. Growing in popularity with AI companies. Example: AWS, Twilio, OpenAI." },
    ],
  },
  "/business/pricing": {
    title: "Pricing strategy for first-time founders",
    items: [
      { term: "You're Probably Charging Too Little", explanation: "The #1 pricing mistake founders make. If no one complains about your price, it's too low. Raise prices until 20% of prospects say no." },
      { term: "Cost-Plus vs Value-Based", explanation: "Cost-plus: your cost + margin. Value-based: what it's worth to the customer. Always use value-based. If your tool saves someone $10K/month, charging $500/month is a bargain." },
      { term: "Annual Discount", explanation: "Offer 10-20% off for annual plans. This gives you cash upfront and reduces churn. Win-win. Most B2B SaaS offers both monthly and annual." },
      { term: "Price Anchoring", explanation: "Show your most expensive plan first. It makes the mid-tier plan feel like a great deal. That's why pricing pages show 3 tiers with the middle one highlighted." },
    ],
  },
  "/business/gtm": {
    title: "Go-to-market strategy explained",
    items: [
      { term: "GTM (Go-to-Market)", explanation: "Your plan for getting your product into customers' hands. It covers who you're selling to, how you'll reach them, and what your sales process looks like." },
      { term: "Product-Led Growth (PLG)", explanation: "Let the product sell itself. Free trial or freemium, users experience value, then upgrade. Works for tools with quick time-to-value. Example: Figma, Notion, Slack." },
      { term: "Sales-Led Growth", explanation: "Hire salespeople to demo and close deals. Better for complex, high-value products (>$10K/year). Required for enterprise sales." },
      { term: "Channel Strategy", explanation: "Where you'll find customers. Content marketing, cold outreach, partnerships, paid ads, communities. Start with ONE channel, master it, then expand." },
    ],
  },
  "/legal/contracts": {
    title: "Contracts basics for founders",
    items: [
      { term: "MSA (Master Service Agreement)", explanation: "The main contract between you and a client. Covers the general terms. Specific projects get a separate SOW (Statement of Work) under the MSA." },
      { term: "NDA (Non-Disclosure Agreement)", explanation: "Prevents the other party from sharing your confidential info. Most VCs won't sign NDAs. For customers and partners, use mutual NDAs (both sides are protected)." },
      { term: "IP Assignment", explanation: "Ensures any work done for your company belongs to the company, not the individual. Every employee and contractor should sign one. Without it, they could claim ownership of code they wrote." },
      { term: "Indemnification", explanation: "Who pays if something goes wrong. In B2B contracts, customers often want you to cover them if your product causes damage. Negotiate limits — don't accept unlimited liability." },
    ],
  },
  "/legal/compliance": {
    title: "Compliance basics for startups",
    items: [
      { term: "Why Care About Compliance?", explanation: "Ignoring compliance can kill your startup — fines, lawsuits, or losing the ability to operate. Get the basics right early. It's easier than fixing problems later." },
      { term: "Privacy (GDPR / CCPA)", explanation: "If you collect user data, you need a privacy policy. GDPR applies if you have any European users. CCPA applies for California users. Both require you to tell users what data you collect and let them delete it." },
      { term: "SOC 2", explanation: "A security certification that enterprise customers require. Expensive ($20-50K) but necessary for B2B SaaS. Start preparing early — it takes 6-12 months." },
      { term: "Terms of Service", explanation: "The legal agreement between you and your users. Covers liability, acceptable use, and dispute resolution. Use a template to start — don't pay a lawyer $5K for a v1." },
    ],
  },
  "/legal/ip": {
    title: "Protecting your intellectual property",
    items: [
      { term: "Trademark", explanation: "Protects your brand name, logo, and slogans. File a federal trademark ($250-350) once you've settled on a name. It prevents others from using a confusingly similar name." },
      { term: "Patent", explanation: "Protects inventions and novel processes. Expensive ($10-15K+) and takes 2-3 years. Most software startups don't need patents early on. Focus on speed, not IP protection." },
      { term: "Copyright", explanation: "Automatically protects creative works (code, designs, content) the moment they're created. You don't need to register, but registration makes enforcement easier." },
      { term: "Trade Secret", explanation: "Information that derives value from being secret (algorithms, customer lists, processes). Protected as long as you take reasonable steps to keep it secret. NDAs help here." },
    ],
  },
};

export function FounderEducation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const education = EDUCATION[pathname];
  if (!education) return null;

  return (
    <div className="mx-auto max-w-[800px] mt-8 mb-4">
      <div className="rounded-xl border border-black/[0.06] bg-black/[0.02]">
        <button
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-between px-4 py-3 text-left"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">
              ?
            </span>
            <span className="text-[13px] font-medium text-black/70">
              {education.title}
            </span>
          </div>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`text-black/40 transition-transform ${open ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {open && (
          <div className="border-t border-black/[0.06] px-4 py-3 space-y-4">
            {education.items.map((item, i) => (
              <div key={i}>
                <p className="text-[12px] font-semibold text-black/80">
                  {item.term}
                </p>
                <p className="mt-0.5 text-[12px] text-black/50 leading-relaxed">
                  {item.explanation}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
