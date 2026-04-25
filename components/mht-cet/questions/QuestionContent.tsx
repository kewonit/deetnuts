import katex, { type KatexOptions } from "katex";
import Image from "next/image";

import type { QuestionBlock } from "@/lib/mht-cet/questions/content-schema";

type QuestionContentProps = {
  blocks: readonly QuestionBlock[];
  variant?: "question" | "option" | "explanation";
};

const katexOptions: KatexOptions = {
  throwOnError: false,
  trust: false,
  strict: "warn",
  output: "htmlAndMathml",
};

function renderMath(tex: string, displayMode = false) {
  try {
    return katex.renderToString(tex, {
      ...katexOptions,
      displayMode,
    });
  } catch {
    return tex;
  }
}

function renderBlock(block: QuestionBlock, index: number) {
  switch (block.type) {
    case "paragraph":
      return (
        <p className="mht-cet-question-content__paragraph" key={index}>
          {block.text}
        </p>
      );
    case "math":
      return (
        <span
          className={
            block.display
              ? "mht-cet-question-content__math mht-cet-question-content__math--display"
              : "mht-cet-question-content__math"
          }
          dangerouslySetInnerHTML={{
            __html: renderMath(block.tex, block.display),
          }}
          key={index}
        />
      );
    case "image":
      if (!block.alt.trim()) {
        return (
          <p className="mht-cet-question-content__warning" key={index}>
            Image alt text required
          </p>
        );
      }

      return (
        <Image
          alt={block.alt}
          className="mht-cet-question-content__image"
          height={block.height ?? 405}
          key={index}
          src={block.src}
          unoptimized
          width={block.width ?? 720}
        />
      );
    case "table":
      return (
        <div className="mht-cet-question-content__table-wrap" key={index}>
          <table className="mht-cet-question-content__table">
            {block.caption ? <caption>{block.caption}</caption> : null}
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "list": {
      const ListTag = block.ordered ? "ol" : "ul";

      return (
        <ListTag className="mht-cet-question-content__list" key={index}>
          {block.items.map((item, itemIndex) => (
            <li key={itemIndex}>{item}</li>
          ))}
        </ListTag>
      );
    }
    default:
      return null;
  }
}

export function QuestionContent({
  blocks,
  variant = "question",
}: QuestionContentProps) {
  return (
    <div className="mht-cet-question-content" data-variant={variant}>
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
}
