import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md whitespace-nowrap [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "",
        outline: "bg-transparent border",
        secondary: "bg-muted text-muted-foreground",
      },
      role: {
        admin: "border-transparent bg-red-600/60 text-white [a&]:hover:bg-red-700",
        mod: "border-transparent bg-blue-600/60 text-white [a&]:hover:bg-blue-700",
        user: "border-transparent bg-gray-200/60 text-gray-900 [a&]:hover:bg-gray-300",
        bot: "border-transparent bg-purple-600/60 text-white [a&]:hover:bg-purple-700",
      },
    },
  }
);

function Badge({
  className,
  variant,
  role,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, role }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
