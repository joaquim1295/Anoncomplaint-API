"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchBar } from "./SearchBar";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import { useI18n } from "./providers/I18nProvider";

export function HomeSearchBar() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQ = searchParams.get("q") ?? "";
  const urlCompanyName = searchParams.get("company_name") ?? "";
  const [companyQuery, setCompanyQuery] = useState(urlCompanyName);
  const [companySuggestions, setCompanySuggestions] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const q = companyQuery.trim();
    if (!q) {
      setCompanySuggestions([]);
      return;
    }
    const timeout = setTimeout(async () => {
      const response = await fetch(`/api/v1/company/public/search?q=${encodeURIComponent(q)}`, {
        credentials: "include",
      });
      const payload = await response.json().catch(() => null);
      setCompanySuggestions(Array.isArray(payload?.data) ? payload.data : []);
    }, 250);
    return () => clearTimeout(timeout);
  }, [companyQuery]);

  useEffect(() => {
    setCompanyQuery(urlCompanyName);
  }, [urlCompanyName]);

  return (
    <div className="flex min-w-0 w-full flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
      <SearchBar
        key={urlQ}
        className="min-w-0 flex-1 sm:max-w-none"
        defaultValue={urlQ}
        placeholder={t("search.homeComplaintsPlaceholder")}
        debounceMs={500}
        onSearch={(value) => {
          const params = new URLSearchParams(searchParams.toString());
          if (value.trim()) {
            params.set("q", value.trim());
          } else {
            params.delete("q");
          }
          const query = params.toString();
          router.replace(query ? `/?${query}` : "/");
        }}
      />
      <div className="relative min-w-0 w-full sm:w-auto sm:shrink-0">
        <Input
          value={companyQuery}
          onChange={(e) => {
            setCompanyQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={t("search.homeCompanyPlaceholder")}
          className="w-full min-w-0 sm:w-48"
        />
        {open && companySuggestions.length > 0 && (
          <div className="absolute left-0 right-0 z-20 mt-1 max-h-48 min-w-0 overflow-auto rounded-xl border border-zinc-200/90 bg-white/95 p-1 shadow-lg backdrop-blur sm:left-auto sm:right-0 sm:w-64 dark:border-zinc-800/80 dark:bg-zinc-950/95 dark:shadow-none dark:ring-1 dark:ring-inset dark:ring-zinc-800/80">
            {companySuggestions.map((company) => (
              <button
                key={company.id}
                type="button"
                className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900/70"
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set("company", company.id);
                  params.set("company_name", company.name);
                  router.replace(`/?${params.toString()}`);
                  setCompanyQuery(company.name);
                  setOpen(false);
                }}
              >
                <span className="truncate">{company.name}</span>
                <span className="ml-2 text-xs text-zinc-500">/{company.slug}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {searchParams.get("company") && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="shrink-0 self-start sm:self-center"
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString());
            params.delete("company");
            params.delete("company_name");
            router.replace(params.toString() ? `/?${params.toString()}` : "/");
            setCompanyQuery("");
            setCompanySuggestions([]);
          }}
        >
          Limpar empresa
        </Button>
      )}
    </div>
  );
}
