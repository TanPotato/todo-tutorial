import { Button as ShadcnButton, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Button({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof ShadcnButton>) {
  return (
    <ShadcnButton
      size={size}
      className={cn(size === "default" && "px-3", className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
