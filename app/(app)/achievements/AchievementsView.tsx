import { Card, CardContent } from "@/components/ui/Card";

interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt: string | null;
  icon: string;
}

function AchievementsView({
  achievements,
}: {
  achievements: Achievement[];
}) {
  const unlocked = achievements.filter((a) => a.unlocked);
  const locked = achievements.filter((a) => !a.unlocked);

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-4 text-lg font-semibold text-slate-900">
        Achievements
      </h1>

      {achievements.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-sm text-slate-500">
            No achievements yet. Keep running your business and they will
            appear.
          </p>
        </div>
      )}

      {unlocked.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
            Unlocked
          </h2>
          <div className="flex flex-col gap-2">
            {unlocked.map((a) => (
              <Card key={a.id}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-900">
                    <span className="text-lg">*</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {a.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {a.description}
                    </p>
                  </div>
                  {a.unlockedAt && (
                    <span className="text-xs text-slate-500">
                      {new Date(a.unlockedAt).toLocaleDateString()}
                    </span>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {locked.length > 0 && (
        <div>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
            Locked
          </h2>
          <div className="flex flex-col gap-2">
            {locked.map((a) => (
              <Card key={a.id} className="opacity-50">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                    <span className="text-lg text-slate-500">
                      ?
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {a.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {a.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export { AchievementsView };
