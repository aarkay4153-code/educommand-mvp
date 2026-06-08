"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

type PrintButtonProps = {
  label?: string;
  variant?: "primary" | "secondary" | "ghost";
};

export function PrintButton({ label = "Print / Save as PDF", variant = "secondary" }: PrintButtonProps) {
  return (
    <Button className="print:hidden" onClick={() => window.print()} variant={variant}>
      <Printer className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}
