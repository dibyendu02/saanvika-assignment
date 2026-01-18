import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, error, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
        error && "border-red-500 focus:ring-red-500",
        className
      )}
      ref={ref}
      {...props} />
  );
})
Input.displayName = "Input"

export { Input }
