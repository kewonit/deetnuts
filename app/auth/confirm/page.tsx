
import Link from "next/link";
import { SubmitButton } from "@/app/login/sumbit-button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, } from '@/components/ui/input-otp'
import { verifyOtp } from "@/app/login/actions";

export default async function OtpForm({ searchParams }: { searchParams: Promise<{ message?: string; email?: string; redirect?: string }> }) {
  const params = await searchParams
  const email = params?.email || ''
  const redirectTo = params?.redirect || '/account'

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mx-auto pt-28 min-h-screen">
      <Link
        href="/"
        className="absolute left-8 top-8 py-2 px-4 rounded-md no-underline text-foreground bg-btn-background hover:bg-btn-background-hover flex items-center group text-sm"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>{" "}
        Back
      </Link>

      {params?.message && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm text-center">{params.message}</p>
        </div>
      )}

      <form className="animate-in flex-1 flex flex-col w-full justify-center gap-4 text-foreground">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Enter OTP</h1>
          <p className="text-muted-foreground">An OTP has been sent to your email address.</p>
          <p className="text-muted-foreground">(gib it a few seconds pls, also check the spam folder thanks)</p>
        </div>

        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="redirect" value={redirectTo} />

        <div>
          <label className="text-md font-medium" htmlFor="otp">
            OTP
          </label>
          <InputOTP maxLength={6} name="otp">
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <SubmitButton
          formAction={verifyOtp}
          className="bg-main border-2 border-black mt-4"
          pendingText="Verifying..."
        >
          Verify OTP
        </SubmitButton>
      </form>
    </div>
  );
}
