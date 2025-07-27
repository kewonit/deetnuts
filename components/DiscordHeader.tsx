// components/DiscordHeader.tsx
import React from 'react';

const DiscordHeader = () => {
  return (
    <div className="bg-purple-600 text-white py-2 px-4 text-center z-50 top-0 left-0 right-0">
      <span>🎉 Join our Discord for updates & support! </span>
      <a
        href="https://discord.gg/xbtqGcQ6SF"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-purple-200 transition-colors"
      >
        Click here
      </a>
    </div>
  );
};

export default DiscordHeader;
