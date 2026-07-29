const EJAM_URL = "https://www.ejam.in";

export default function EjamHeader() {
  return (
    <a
      href={EJAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed inset-x-0 top-0 z-50 flex h-9 items-center justify-center bg-purple-700 px-4 text-center text-xs font-bold text-white transition-colors hover:bg-purple-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white sm:text-sm"
      aria-label="Open eJAM for JEE Main and JEE Advanced"
    >
      JEE Main &amp; JEE Advanced are on eJAM&nbsp;→
    </a>
  );
}
