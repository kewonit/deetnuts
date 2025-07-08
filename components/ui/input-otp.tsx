"use client"

import { OTPInput, OTPInputContext } from "input-otp"
import { Dot } from "lucide-react"

import * as React from "react"

import { cn } from "@/lib/utils"

function InputOTP({
    className,
    containerClassName,
    ...props
}: React.ComponentProps<typeof OTPInput> & {
    containerClassName?: string
}) {
    return (
        <OTPInput
            data-slot="input-otp"
            containerClassName={cn(
                "flex items-center gap-2 has-disabled:opacity-50 justify-center w-full",
                containerClassName,
            )}
            className={cn("disabled:cursor-not-allowed", className)}
            {...props}
        />
    )
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="input-otp-group"
            className={cn("flex items-center justify-center", className)}
            {...props}
        />
    )
}

function InputOTPSlot({
    index,
    className,
    ...props
}: React.ComponentProps<"div"> & { index: number }) {
    const inputOTPContext = React.useContext(OTPInputContext)
    const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {}

    return (
        <div
            data-slot="input-otp-slot"
            data-active={isActive}
            className={cn(
                "relative flex size-10 items-center justify-center border-2 border-gray-300 bg-white text-sm font-medium text-gray-900 first:rounded-l-md last:rounded-r-md transition-all shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100",
                isActive && "z-10 ring-2 ring-blue-500 border-blue-500 dark:ring-blue-400 dark:border-blue-400",
                className,
            )}
            {...props}
        >
            {char}
            {hasFakeCaret && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="h-4 w-px animate-caret-blink bg-gray-900 dark:bg-gray-100 duration-1000" />
                </div>
            )}
        </div>
    )
}

function InputOTPSeparator({ ...props }: React.ComponentProps<"div">) {
    return (
        <div data-slot="input-otp-separator" role="separator" {...props}>
            <Dot className="size-4" />
        </div>
    )
}

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
