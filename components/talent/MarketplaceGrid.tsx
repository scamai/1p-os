"use client";

import * as React from "react";
import { AgentListing, type AgentListingProps } from "@/components/talent/AgentListing";

type ListingItem = Omit<AgentListingProps, "onHire">;

const categories = [
  "All",
  "Admin",
  "Finance",
  "Marketing",
  "Customer Support",
  "Operations",
  "Development",
  "Analytics",
];

const sortOptions = [
  { value: "popular", label: "Most Popular" },
  { value: "rating", label: "Highest Rated" },
  { value: "cost-low", label: "Lowest Cost" },
  { value: "cost-high", label: "Highest Cost" },
  { value: "newest", label: "Newest" },
];

interface MarketplaceGridProps {
  listings: ListingItem[];
  onHire: (id: string) => void;
}

function MarketplaceGrid({ listings, onHire }: MarketplaceGridProps) {
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState("All");
  const [sort, setSort] = React.useState("popular");

  const filtered = listings.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      category === "All" || l.category === category;
    return matchesSearch && matchesCategory;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case "rating":
        return b.rating - a.rating;
      case "cost-low":
        return a.estimatedDailyCost.localeCompare(b.estimatedDailyCost);
      case "cost-high":
        return b.estimatedDailyCost.localeCompare(a.estimatedDailyCost);
      case "newest":
        return 0;
      default:
        return b.installCount - a.installCount;
    }
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search agents..."
          className="h-9 flex-1 rounded-md border border-[var(--border)] bg-transparent px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
        <div className="flex gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-9 rounded-md border border-[var(--border)] bg-transparent px-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-9 rounded-md border border-[var(--border)] bg-transparent px-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            No agents found matching your search.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {sorted.map((listing) => (
            <AgentListing key={listing.id} {...listing} onHire={onHire} />
          ))}
        </div>
      )}
    </div>
  );
}

export { MarketplaceGrid };
