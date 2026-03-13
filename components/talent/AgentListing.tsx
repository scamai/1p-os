import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface AgentListingProps {
  id: string;
  name: string;
  description: string;
  author: string;
  rating: number;
  installCount: number;
  estimatedDailyCost: string;
  category: string;
  onHire: (id: string) => void;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`h-3 w-3 ${
            star <= rating
              ? "fill-[var(--warning)] text-[var(--warning)]"
              : "fill-none text-[var(--muted-foreground)]"
          }`}
          viewBox="0 0 20 20"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M10 1l2.39 4.84L18 6.71l-4 3.9.94 5.5L10 13.48l-4.94 2.63.94-5.5-4-3.9 5.61-.87L10 1z" />
        </svg>
      ))}
    </div>
  );
}

function AgentListing({
  id,
  name,
  description,
  author,
  rating,
  installCount,
  estimatedDailyCost,
  category,
  onHire,
}: AgentListingProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">
                {name}
              </h3>
              <Badge variant="outline">{category}</Badge>
            </div>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
          <span>by {author}</span>
          <StarRating rating={rating} />
          <span>{installCount.toLocaleString()} installs</span>
          <span className="font-mono">{estimatedDailyCost}</span>
        </div>

        <div className="mt-3">
          <Button size="sm" onClick={() => onHire(id)}>
            Hire
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export { AgentListing };
export type { AgentListingProps };
