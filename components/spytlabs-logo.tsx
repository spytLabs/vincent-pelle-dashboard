import * as React from "react"
import { cn } from "@/lib/utils"
import logo from "@/public/spyt-small.png"

export function SpytLabsLogo({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div className={cn("flex items-center gap-1 select-none", className)} {...props}>
            <img src={logo.src} alt="SpytLabs Logo" className="h-[1.6em] w-auto shrink-0" />
        </div>
    )
}
