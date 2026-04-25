import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import DiscordHeader from "./DiscordHeader";

test("DiscordHeader renders a footer-friendly Discord invite with the live external link", () => {
  const markup = renderToStaticMarkup(<DiscordHeader />);

  assert.match(markup, /Join our Discord for updates &amp; support!/i);
  assert.match(markup, /https:\/\/discord\.gg\/xbtqGcQ6SF/i);
  assert.match(markup, /justify-center/);
  assert.doesNotMatch(markup, /bg-purple-600/);
});
