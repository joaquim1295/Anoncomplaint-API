"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "./ui/Input";
import { cn } from "../lib/utils";

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (value: string) => void;
  debounceMs?: number;
  className?: string;
  defaultValue?: string;
}

export function SearchBar({
  placeholder = "Procurar…",
  onSearch,
  debounceMs = 300,
  className,
  defaultValue = "",
}: SearchBarProps) {
  const [value, setValue] = useState(defaultValue);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setValue(v);
      if (!onSearch) return;
      if (debounceMs <= 0) {
        onSearch(v);
        return;
      }
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        onSearch(v);
        timeoutRef.current = null;
      }, debounceMs);
    },
    [onSearch, debounceMs]
  );

  return (
    <div className={cn("relative w-full min-w-0 max-w-full sm:max-w-sm", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-700/80 dark:text-emerald-300/80" aria-hidden />
      <Input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        className="pl-10 pr-10"
        aria-label="Pesquisar"
      />
      {value.trim().length > 0 && (
        <button
          type="button"
          className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-zinc-500 ring-cyber transition hover:bg-zinc-200/80 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900/50 dark:hover:text-zinc-100"
          onClick={() => {
            setValue("");
            onSearch?.("");
          }}
          aria-label="Limpar pesquisa"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
