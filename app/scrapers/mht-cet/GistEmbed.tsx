"use client";

import React from 'react';

interface GistEmbedProps {
  gistId: string;
  file?: string;
}

const GistEmbed: React.FC<GistEmbedProps> = ({ gistId, file }) => {
  const fileParam = file ? `?file=${file}` : '';
  const gistUrl = `https://gist.github.com/${gistId}.js${fileParam}`;
  const iframeUrl = 
  `
    <head>
      <base target='_blank' />
    </head>
    <body>
      <script src='${gistUrl}'></script>
    </body>
  `;

  return (
    <iframe
      srcDoc={iframeUrl}
      width="100%"
      style={{ border: 0, overflow: 'hidden' }}
      onLoad={(e) => {
        const iframe = e.target as HTMLIFrameElement;
        const height = iframe.contentWindow?.document.body.scrollHeight;
        if (height) iframe.style.height = `${height}px`;
      }}
    />
  );
};

export default GistEmbed;