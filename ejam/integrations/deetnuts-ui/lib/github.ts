const TOOL_REQUEST_ISSUE_BODY = [
  "## Tool name",
  "<!-- same what title says :) -->",
  "",
  "",
  "## What should it do?",
  "<!-- What problem would it solve? A few sentences is enough. -->",
  "",
  "",
  "## Who is it for?",
  "<!-- e.g. Engineering, Medical, Generic etc. -->",
  "",
  "",
  "## Anything else? (optional)",
  "<!-- Links, screenshots, or similar tools you like -->",
  "",
].join("\n");

/** GitHub new-issue URL with tool-request label and prefilled template. */
export const TOOL_REQUEST_ISSUE_URL = `https://github.com/su6u/ejam/issues/new?labels=tool-request&title=${encodeURIComponent(
  "Tool request: ",
)}&body=${encodeURIComponent(TOOL_REQUEST_ISSUE_BODY)}`;
