"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada",
  "New Hampshire","New Jersey","New Mexico","New York","North Carolina",
  "North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island",
  "South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont",
  "Virginia","Washington","West Virginia","Wisconsin","Wyoming",
];

const BUSINESS_TYPES = [
  { value: "saas", label: "SaaS" },
  { value: "marketplace", label: "Marketplace" },
  { value: "hardware", label: "Hardware" },
  { value: "services", label: "Services" },
  { value: "other", label: "Other" },
];

const INCORPORATION_PATHS = [
  {
    value: "diy",
    label: "DIY",
    cost: "$89",
    description:
      "File directly with the state yourself. Cheapest option, but you handle all the paperwork.",
  },
  {
    value: "budget_service",
    label: "Budget service",
    cost: "$100-150",
    description:
      "Use a filing service like Northwest or Incfile. They handle paperwork, you make decisions.",
  },
  {
    value: "stripe_atlas",
    label: "Stripe Atlas",
    cost: "$500",
    description:
      "All-in-one package with a bank account, tax ID, and post-incorporation support from Stripe.",
  },
];

interface QuizData {
  founder_type: "solo" | "cofounders";
  cofounder_count: number | null;
  business_type: string;
  business_description: string;
  raising_vc: boolean | null;
  state: string;
  incorporation_path: string;
  company_name: string;
}

const TOTAL_STEPS = 6;

export function OnboardingQuiz() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<QuizData>({
    founder_type: "solo",
    cofounder_count: null,
    business_type: "",
    business_description: "",
    raising_vc: null,
    state: "",
    incorporation_path: "",
    company_name: "",
  });

  function canAdvance(): boolean {
    switch (currentStep) {
      case 0:
        return (
          data.founder_type === "solo" ||
          (data.founder_type === "cofounders" &&
            data.cofounder_count !== null &&
            data.cofounder_count > 0)
        );
      case 1:
        return data.business_type !== "";
      case 2:
        return data.raising_vc !== null;
      case 3:
        return data.state !== "";
      case 4:
        return data.incorporation_path !== "";
      case 5:
        return data.company_name.trim() !== "";
      default:
        return false;
    }
  }

  function next() {
    if (currentStep < TOTAL_STEPS - 1 && canAdvance()) {
      setCurrentStep((s) => s + 1);
    }
  }

  function back() {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }

  async function handleSubmit() {
    if (!canAdvance()) return;
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    const { error } = await supabase.from("founder_profiles").insert({
      user_id: user.id,
      company_name: data.company_name.trim(),
      founder_type: data.founder_type,
      cofounder_count:
        data.founder_type === "cofounders" ? data.cofounder_count : null,
      business_type: data.business_type,
      business_description: data.business_description.trim() || null,
      raising_vc: data.raising_vc,
      state: data.state,
      incorporation_path: data.incorporation_path,
    });

    if (error) {
      console.error("Failed to save profile:", error);
      setLoading(false);
      return;
    }

    router.push("/launch");
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-8">
      {/* Navigation */}
      <div className="mb-8 flex items-center gap-3">
        {currentStep > 0 && (
          <button
            onClick={back}
            className="flex h-8 w-8 items-center justify-center text-black/50 transition-colors duration-150 hover:bg-black/[0.04] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-1"
            aria-label="Go back"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M8.5 2L3.5 7l5 5" />
            </svg>
          </button>
        )}
        <div className="flex flex-1 items-center gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 transition-colors duration-150 ${
                i <= currentStep ? "bg-black" : "bg-black/[0.08]"
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-black/40 tabular-nums">
          {currentStep + 1}/{TOTAL_STEPS}
        </span>
      </div>

      {/* Step 0: Solo or co-founder */}
      {currentStep === 0 && (
        <div>
          <h2 className="text-base font-semibold text-black mb-1">
            Are you a solo founder?
          </h2>
          <p className="text-[13px] text-black/50 mb-6">
            This shapes your incorporation path and operating agreement needs.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() =>
                setData((d) => ({
                  ...d,
                  founder_type: "solo",
                  cofounder_count: null,
                }))
              }
              className={`w-full border px-4 py-3 text-left text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-1 ${
                data.founder_type === "solo"
                  ? "border-black bg-black/[0.02] font-medium text-black"
                  : "border-black/[0.08] text-black/70 hover:border-black/30 hover:bg-black/[0.02]"
              }`}
            >
              Solo founder
            </button>
            <button
              onClick={() =>
                setData((d) => ({
                  ...d,
                  founder_type: "cofounders",
                  cofounder_count: d.cofounder_count || 2,
                }))
              }
              className={`w-full border px-4 py-3 text-left text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-1 ${
                data.founder_type === "cofounders"
                  ? "border-black bg-black/[0.02] font-medium text-black"
                  : "border-black/[0.08] text-black/70 hover:border-black/30 hover:bg-black/[0.02]"
              }`}
            >
              I have co-founders
            </button>
          </div>
          {data.founder_type === "cofounders" && (
            <div className="mt-4">
              <Input
                label="How many co-founders (including you)?"
                type="number"
                min={2}
                max={10}
                value={data.cofounder_count ?? ""}
                onChange={(e) =>
                  setData((d) => ({
                    ...d,
                    cofounder_count: parseInt(e.target.value) || null,
                  }))
                }
              />
            </div>
          )}
          <div className="mt-6">
            <Button onClick={next} disabled={!canAdvance()} className="w-full">
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* Step 1: Business type */}
      {currentStep === 1 && (
        <div>
          <h2 className="text-base font-semibold text-black mb-1">
            What are you building?
          </h2>
          <p className="text-[13px] text-black/50 mb-6">
            Determines which permits, licenses, and tax considerations to show.
          </p>
          <div className="flex flex-col gap-2">
            {BUSINESS_TYPES.map((bt) => (
              <button
                key={bt.value}
                onClick={() =>
                  setData((d) => ({ ...d, business_type: bt.value }))
                }
                className={`w-full border px-4 py-3 text-left text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-1 ${
                  data.business_type === bt.value
                    ? "border-black bg-black/[0.02] font-medium text-black"
                    : "border-black/[0.08] text-black/70 hover:border-black/30 hover:bg-black/[0.02]"
                }`}
              >
                {bt.label}
              </button>
            ))}
          </div>
          {data.business_type === "other" && (
            <div className="mt-4">
              <textarea
                placeholder="Describe what you're building..."
                value={data.business_description}
                onChange={(e) =>
                  setData((d) => ({
                    ...d,
                    business_description: e.target.value,
                  }))
                }
                rows={3}
                className="w-full border border-black/[0.08] bg-transparent px-3 py-2 text-sm text-black placeholder:text-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-1"
              />
            </div>
          )}
          <div className="mt-6">
            <Button onClick={next} disabled={!canAdvance()} className="w-full">
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: VC */}
      {currentStep === 2 && (
        <div>
          <h2 className="text-base font-semibold text-black mb-1">
            Planning to raise VC?
          </h2>
          <p className="text-[13px] text-black/50 mb-6">
            If yes, we recommend incorporating as a Delaware C-Corp.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setData((d) => ({ ...d, raising_vc: true }))}
              className={`w-full border px-4 py-3 text-left text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-1 ${
                data.raising_vc === true
                  ? "border-black bg-black/[0.02] font-medium text-black"
                  : "border-black/[0.08] text-black/70 hover:border-black/30 hover:bg-black/[0.02]"
              }`}
            >
              Yes
            </button>
            <button
              onClick={() => setData((d) => ({ ...d, raising_vc: false }))}
              className={`w-full border px-4 py-3 text-left text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-1 ${
                data.raising_vc === false
                  ? "border-black bg-black/[0.02] font-medium text-black"
                  : "border-black/[0.08] text-black/70 hover:border-black/30 hover:bg-black/[0.02]"
              }`}
            >
              No
            </button>
          </div>
          <div className="mt-6">
            <Button onClick={next} disabled={!canAdvance()} className="w-full">
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: State */}
      {currentStep === 3 && (
        <div>
          <h2 className="text-base font-semibold text-black mb-1">
            Where do you live?
          </h2>
          <p className="text-[13px] text-black/50 mb-6">
            Your state determines filing requirements, taxes, and registered
            agent needs.
          </p>
          <select
            value={data.state}
            onChange={(e) =>
              setData((d) => ({ ...d, state: e.target.value }))
            }
            className="h-9 w-full border border-black/[0.08] bg-transparent px-3 text-sm text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-1"
          >
            <option value="">Select your state</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <div className="mt-6">
            <Button onClick={next} disabled={!canAdvance()} className="w-full">
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Incorporation path */}
      {currentStep === 4 && (
        <div>
          <h2 className="text-base font-semibold text-black mb-1">
            Choose your incorporation path
          </h2>
          <p className="text-[13px] text-black/50 mb-6">
            All paths get you to the same result. Pick based on your budget and
            comfort level.
          </p>
          <div className="flex flex-col gap-2">
            {INCORPORATION_PATHS.map((path) => (
              <Card
                key={path.value}
                className={`cursor-pointer transition-colors duration-150 ${
                  data.incorporation_path === path.value
                    ? "border-black bg-black/[0.02]"
                    : ""
                }`}
                onClick={() =>
                  setData((d) => ({ ...d, incorporation_path: path.value }))
                }
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-1">
                    <span
                      className={`text-sm ${
                        data.incorporation_path === path.value
                          ? "font-semibold text-black"
                          : "font-medium text-black"
                      }`}
                    >
                      {path.label}
                    </span>
                    <span className="text-xs text-black/50 tabular-nums ml-3">
                      {path.cost}
                    </span>
                  </div>
                  <p className="text-[13px] text-black/50 leading-relaxed">
                    {path.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-6">
            <Button onClick={next} disabled={!canAdvance()} className="w-full">
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* Step 5: Summary */}
      {currentStep === 5 && (
        <div>
          <h2 className="text-base font-semibold text-black mb-1">
            Almost there
          </h2>
          <p className="text-[13px] text-black/50 mb-6">
            Name your company and review your plan.
          </p>

          <div className="mb-6">
            <Input
              label="Company name"
              placeholder="Acme Inc."
              value={data.company_name}
              onChange={(e) =>
                setData((d) => ({ ...d, company_name: e.target.value }))
              }
            />
          </div>

          <div className="border border-black/[0.08] bg-black/[0.02] p-4 mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-black/50 mb-3">
              Your plan
            </h3>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-black/50">Founder type</span>
                <span className="text-black">
                  {data.founder_type === "solo"
                    ? "Solo"
                    : `${data.cofounder_count} co-founders`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-black/50">Building</span>
                <span className="text-black capitalize">
                  {data.business_type}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-black/50">Raising VC</span>
                <span className="text-black">
                  {data.raising_vc ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-black/50">State</span>
                <span className="text-black">{data.state}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black/50">Incorporation</span>
                <span className="text-black">
                  {INCORPORATION_PATHS.find(
                    (p) => p.value === data.incorporation_path
                  )?.label ?? data.incorporation_path}
                </span>
              </div>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            loading={loading}
            disabled={!canAdvance()}
            className="w-full"
          >
            Start building
          </Button>
        </div>
      )}
    </div>
  );
}
