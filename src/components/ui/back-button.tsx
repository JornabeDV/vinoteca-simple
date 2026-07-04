"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";

interface BackButtonProps extends VariantProps<typeof buttonVariants> {
  href?: string;
  className?: string;
  label?: string;
}

export function BackButton({
  href,
  className,
  label,
  variant = "outline",
  size = "icon",
}: BackButtonProps) {
  const router = useRouter();

  if (href) {
    return (
      <Link href={href}>
        <Button variant={variant} size={size} className={cn("shrink-0", className)}>
          <ArrowLeft className="h-4 w-4" />
          {label && <span>{label}</span>}
        </Button>
      </Link>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={cn("shrink-0", className)}
      onClick={() => router.back()}
    >
      <ArrowLeft className="h-4 w-4" />
      {label && <span>{label}</span>}
    </Button>
  );
}
