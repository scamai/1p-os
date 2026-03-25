export default function Page() {
  const name = "SAFEs";
  return (
    <div className="mx-auto max-w-[640px]">
      <h1 className="font-heading text-[clamp(1.5rem,3vw,1.75rem)] italic font-light tracking-[-0.01em] text-black">{name}</h1>
      <p className="mt-2 text-[14px] leading-[1.6] text-black/40">Coming soon — this section will help you manage your {name.toLowerCase()}.</p>
    </div>
  );
}
