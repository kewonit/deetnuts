migrate((app) => {
  // No public collection access, including for normal authenticated users.
  // The two backend-only hooks are the only application entry points.
  app.save(new Collection({
    type: "base", name: "timekeeper_transfer_tickets",
    listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
    fields: [
      { type: "text", name: "token_hash", required: true, pattern: "^[0-9a-f]{64}$", max: 64 },
      { type: "text", name: "client_hash", required: true, pattern: "^[0-9a-f]{64}$", max: 64 },
      { type: "text", name: "payload_json", max: 65536, hidden: true },
      { type: "date", name: "expires_at", required: true },
      { type: "bool", name: "consumed" },
    ],
    indexes: [
      "CREATE UNIQUE INDEX `idx_timekeeper_ticket_hash` ON `timekeeper_transfer_tickets` (`token_hash`)",
      "CREATE INDEX `idx_timekeeper_ticket_expiry` ON `timekeeper_transfer_tickets` (`expires_at`)",
      "CREATE INDEX `idx_timekeeper_ticket_client` ON `timekeeper_transfer_tickets` (`client_hash`, `expires_at`)",
    ],
  }));
}, (app) => {
  app.delete(app.findCollectionByNameOrId("timekeeper_transfer_tickets"));
});
