import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 font-medium rounded-md whitespace-nowrap transition-all",
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
      size: {
        xs: "h-5 px-2 py-0.5 text-xs [&>svg]:size-3",
        sm: "h-6 px-2 py-0.5 text-xs sm:h-6 sm:px-2 sm:py-0.5 sm:text-xs [&>svg]:size-3 sm:[&>svg]:size-3",
        default: "h-6 sm:h-7 lg:h-8 px-2 sm:px-2 lg:px-2 py-0.5 sm:py-0.5 lg:py-0.5 text-xs sm:text-xs lg:text-sm [&>svg]:size-3 sm:[&>svg]:size-3 lg:[&>svg]:size-3.5",
        md: "h-7 sm:h-8 lg:h-9 px-3 sm:px-3 lg:px-3 py-1 sm:py-1 lg:py-1 text-sm sm:text-sm lg:text-base [&>svg]:size-4 sm:[&>svg]:size-4 lg:[&>svg]:size-4",
        lg: "h-8 sm:h-9 lg:h-10 px-3 sm:px-3 lg:px-4 py-1 sm:py-1 lg:py-2 text-base sm:text-base lg:text-lg [&>svg]:size-4 sm:[&>svg]:size-4 lg:[&>svg]:size-5",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

function Badge({
  className,
  variant,
  role,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, role, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
