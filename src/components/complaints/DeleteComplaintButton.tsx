"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/Button";

export function DeleteComplaintButton({ complaintId }: { complaintId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const response = await fetch(`/api/v1/complaints/${complaintId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(result?.error?.message ?? "Não foi possível eliminar denúncia.");
        return;
      }
      toast.success("Denúncia eliminada.");
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="h-8 rounded-xl px-2 text-xs text-red-300 hover:text-red-200"
      onClick={handleDelete}
      disabled={isPending}
    >
      <Trash2 className="mr-1 h-3.5 w-3.5" aria-hidden />
      <span>Eliminar</span>
    </Button>
  );
}

