"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SearchBar } from "./SearchBar";

export function HomeSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQ = searchParams.get("q") ?? "";

  return (
    <SearchBar
      key={urlQ}
      defaultValue={urlQ}
      placeholder="Pesquisar denúncias..."
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
  );
}
