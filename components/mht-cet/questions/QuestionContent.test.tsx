import assert from "node:assert/strict";
import test from "node:test";

import { renderToStaticMarkup } from "react-dom/server";

import { QuestionContent } from "./QuestionContent";
import type { QuestionBlock } from "@/lib/mht-cet/questions/content-schema";

test("paragraph text appears", () => {
  const html = renderToStaticMarkup(
    <QuestionContent
      blocks={[{ type: "paragraph", text: "Read the stem carefully." }]}
    />,
  );

  assert.match(html, /Read the stem carefully\./);
});

test("display math renders KaTeX HTML and MathML", () => {
  const html = renderToStaticMarkup(
    <QuestionContent blocks={[{ type: "math", tex: "x^2", display: true }]} />,
  );

  assert.match(html, /class="katex/);
  assert.match(html, /<math/);
});

test("invalid math does not throw", () => {
  assert.doesNotThrow(() =>
    renderToStaticMarkup(
      <QuestionContent blocks={[{ type: "math", tex: "\\bad{" }]} />,
    ),
  );
});

test("raw HTML-like text is escaped", () => {
  const html = renderToStaticMarkup(
    <QuestionContent
      blocks={[{ type: "paragraph", text: "<strong>not html</strong>" }]}
    />,
  );

  assert.match(html, /&lt;strong&gt;not html&lt;\/strong&gt;/);
  assert.doesNotMatch(html, /<strong>not html<\/strong>/);
});

test("image block requires alt text", () => {
  const unsafeImage = {
    type: "image",
    src: "/fixture.png",
    alt: "",
    width: 320,
    height: 180,
  } as QuestionBlock;
  const html = renderToStaticMarkup(<QuestionContent blocks={[unsafeImage]} />);

  assert.match(html, /Image alt text required/);
  assert.doesNotMatch(html, /<img/);
});
