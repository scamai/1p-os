export default function Page() {
  const name = "SAFEs";
  return (
    <div className="mx-auto max-w-[640px]">
      <h1 className="text-lg font-semibold text-zinc-900">{name}</h1>
      <p className="mt-1 text-sm text-zinc-500">Coming soon — this section will help you manage your {name.toLowerCase()}.</p>
    </div>
  );
}
