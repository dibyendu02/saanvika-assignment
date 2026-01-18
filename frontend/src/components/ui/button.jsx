import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gray-800 text-white shadow-sm hover:bg-gray-700 active:bg-gray-900",
        destructive:
          "bg-red-500 text-white shadow-sm hover:bg-red-600 active:bg-red-700",
        outline:
          "border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-gray-50 active:bg-gray-100",
        secondary:
          "bg-slate-700 text-white shadow-sm hover:bg-slate-800 active:bg-slate-900",
        ghost:
          "text-gray-700 hover:bg-gray-100 active:bg-gray-200",
        link:
          "text-gray-700 underline-offset-4 hover:underline",
        success:
          "bg-emerald-500 text-white shadow-sm hover:bg-emerald-600 active:bg-emerald-700",
        warning:
          "bg-amber-500 text-white shadow-sm hover:bg-amber-600 active:bg-amber-700",
      },
      size: {
        default: "h-10 px-4 py-2.5",
        xs: "h-7 px-3 py-1.5 text-xs",
        sm: "h-8 rounded-lg px-3.5 py-2 text-sm",
        lg: "h-11 rounded-lg px-5 py-3",
        xl: "h-12 rounded-lg px-6 py-3.5 text-lg",
        icon: "h-10 w-10 p-2.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
