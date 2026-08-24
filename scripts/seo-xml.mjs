const XML_ENTITIES = Object.freeze({
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  quot: '"',
});

export function decodeXml(value) {
  return value.replace(
    /&(amp|apos|gt|lt|quot);/g,
    (entity, name) => XML_ENTITIES[name] || entity,
  );
}

export function extractLocations(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) =>
    decodeXml(match[1].trim()),
  );
}
