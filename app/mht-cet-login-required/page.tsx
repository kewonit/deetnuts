import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { sanitizeMhtCetRedirectPath } from "@/lib/auth-redirect";

type MhtCetLoginRequiredProps = {
  searchParams: Promise<{
    redirect?: string | string[];
  }>;
};

export default async function MHTCETLoginRequired({
  searchParams,
}: MhtCetLoginRequiredProps) {
  const params = await searchParams;
  const redirectTo = sanitizeMhtCetRedirectPath(params?.redirect);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pt-32">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-4">
          <Image
            src="/MHT-CET_logo.png"
            alt="MHT-CET Logo"
            width={120}
            height={120}
            className="mx-auto rounded-lg"
          />
          <h1 className="text-3xl font-bold text-gray-900">
            MHT-CET Resources
          </h1>
          <p className="text-lg text-gray-600">
            Sign in to view MHT-CET cutoff data
          </p>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5 shadow-sm relative overflow-visible">
          <div className="text-center relative z-10">
            <h3 className="text-lg font-semibold text-green-800 mb-1">
              Privacy information
            </h3>
            <p className="text-sm text-green-700 leading-relaxed">
              We collect your email address to enforce usage limits. We do not
              sell your data.
            </p>
          </div>

          {/* Pepe icon positioned at top right with overflow */}
          <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 md:-top-5 md:-right-5">
            <Image
              src="https://res.cloudinary.com/dfyrk32ua/image/upload/v1751715700/pepechill_hqrkgj.webp"
              alt="Pepe Chill"
              width={64}
              height={64}
              className="w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 lg:w-20 lg:h-20 rounded-full object-cover shadow-lg border-2 border-white/50 hover:scale-105 transition-all duration-300 ease-in-out"
            />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-3">
            Sign-in required
          </h2>
          <p className="text-blue-700 mb-4">
            Sign in to view MHT-CET resources, including state cutoffs.
          </p>

          <div className="space-y-3">
            <Link
              href={`/login?redirect=${encodeURIComponent(redirectTo)}`}
              className="block w-full"
            >
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 h-12">
                Sign In
              </Button>
            </Link>

            <Link
              href={`/signup?redirect=${encodeURIComponent(redirectTo)}`}
              className="block w-full"
            >
              <Button
                variant="neutral"
                className="w-full text-blue-700 hover:bg-blue-50 font-medium py-3 h-12 border-blue-300"
              >
                Create Account
              </Button>
            </Link>
          </div>
        </div>

        <div className="text-sm text-gray-500">
          <Link href="/" className="hover:underline">
            Back to home page
          </Link>
        </div>
      </div>
      <div className="mt-16 overflow-hidden flex justify-center">
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none">
          <Image
            src="https://res.cloudinary.com/dfyrk32ua/image/upload/v1751627283/gdgc/clipboard-image-1751627216_j5fqdd.webp"
            alt="MHT-CET Dashboard Preview"
            width="1432"
            height="442"
            className="w-full max-w-4xl rounded-xl shadow-2xl ring-1 ring-gray-200/50"
            priority
          />
        </div>
      </div>
    </div>
  );
}
