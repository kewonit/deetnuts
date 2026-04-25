// components/DiscordHeader.tsx
import React from "react";

const DiscordHeader = () => {
  return (
    <div className="rounded-base border-2 border-black bg-[#FFF8D9]/90 px-4 py-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] backdrop-blur-sm">
      <div className="flex flex-col items-center justify-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
        <p className="max-w-2xl text-sm font-bold leading-relaxed text-gray-900 sm:text-base">
          <span aria-hidden="true" className="mr-2 text-base sm:text-lg">
            🎉
          </span>
          Join our Discord for updates &amp; support!
        </p>
        <a
          href="https://discord.gg/xbtqGcQ6SF"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Join the DEETNUTS Discord community"
          className="inline-flex items-center justify-center rounded-base border-2 border-black bg-black px-4 py-2 text-sm font-bold text-[#FFF4CC] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
        >
          Click here
        </a>
      </div>
    </div>
  );
};

export default DiscordHeader;
