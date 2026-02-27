'use client';
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { buildInsuranceUrl } from "@/lib/url/buildProfileUrl";

interface Insurance {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

interface InsuranceSearchProps {
  insurances: Insurance[];
}

export function InsuranceSearch({ insurances }: InsuranceSearchProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return insurances.filter((i) => i.name.toLowerCase().includes(q)).slice(0, 8);
  }, [query, insurances]);

  return (
    <div className="relative w-full max-w-lg">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search insurance provider..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      {filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
          {filtered.map((ins) => (
            <Link
              key={ins.id}
              to={buildInsuranceUrl(ins.slug)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
              onClick={() => setQuery("")}
            >
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                {ins.logo_url ? (
                  <img src={ins.logo_url} alt={ins.name} className="h-5 w-5 object-contain" />
                ) : (
                  <Shield className="h-4 w-4 text-primary" />
                )}
              </div>
              <span className="font-medium text-sm">{ins.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
