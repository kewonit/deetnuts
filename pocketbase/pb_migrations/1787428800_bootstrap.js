migrate(
  (app) => {
    const serviceRule =
      '@request.auth.collectionName = "app_services" && @request.auth.role = "backend"';

    const services = new Collection({
      type: "auth",
      name: "app_services",
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      authRule: "",
      manageRule: null,
      fields: [
        {
          type: "select",
          name: "role",
          required: true,
          maxSelect: 1,
          values: ["backend"],
        },
      ],
      passwordAuth: { enabled: true, identityFields: ["email"] },
      authToken: { duration: 3600 },
    });
    app.save(services);

    const users = app.findCollectionByNameOrId("users");
    users.listRule = null;
    users.viewRule = "id = @request.auth.id";
    users.createRule = null;
    users.updateRule =
      "id = @request.auth.id" +
      " && @request.body.email:changed = false" +
      " && @request.body.emailVisibility:changed = false" +
      " && @request.body.verified:changed = false" +
      " && @request.body.supabase_id:changed = false" +
      " && @request.body.migration_source_json:changed = false" +
      " && @request.body.migration_source_hash:changed = false" +
      " && @request.body.migration_run_id:changed = false";
    users.deleteRule = null;
    users.authRule = "";
    users.manageRule = null;
    for (const field of [
      new TextField({ name: "supabase_id" }),
      new TextField({ name: "full_name" }),
      new URLField({ name: "avatar_url" }),
      new TextField({ name: "username" }),
      new URLField({ name: "website" }),
      new TextField({ name: "migration_source_json", hidden: true }),
      new TextField({
        name: "migration_source_hash",
        hidden: true,
        pattern: "^[0-9a-f]{64}$",
      }),
      new TextField({
        name: "migration_run_id",
        hidden: true,
        pattern: "^[0-9a-f]{32}$",
      }),
    ]) {
      users.fields.add(field);
    }
    users.indexes = users.indexes.concat([
      "CREATE UNIQUE INDEX `idx_users_supabase_id` ON `users` (`supabase_id`) WHERE `supabase_id` != ''",
    ]);
    users.passwordAuth.enabled = true;
    users.passwordAuth.identityFields = ["email"];
    users.oauth2.enabled = false;
    users.oauth2.providers = [];
    users.oauth2.mappedFields.id = "";
    users.oauth2.mappedFields.name = "full_name";
    users.oauth2.mappedFields.username = "username";
    users.oauth2.mappedFields.avatarURL = "avatar_url";
    users.authToken.duration = 604800;
    app.save(users);

    const migrationAudit = new Collection({
      type: "base",
      name: "migration_audit",
      listRule: serviceRule,
      viewRule: serviceRule,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { type: "text", name: "source", required: true },
        { type: "text", name: "migration_run_id", required: true },
        { type: "text", name: "source_snapshot_at", required: true },
        { type: "text", name: "completed_at" },
        { type: "number", name: "source_records", onlyInt: true },
        { type: "number", name: "target_records", onlyInt: true },
        { type: "text", name: "source_digest", pattern: "^[0-9a-f]{64}$" },
        { type: "text", name: "target_digest", pattern: "^[0-9a-f]{64}$" },
        { type: "bool", name: "verified" },
      ],
    });
    app.save(migrationAudit);

    const migrationTables = new Collection({
      type: "base",
      name: "migration_tables",
      listRule: serviceRule,
      viewRule: serviceRule,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { type: "text", name: "migration_run_id", required: true },
        { type: "text", name: "source_table", required: true },
        { type: "text", name: "target_collection", required: true },
        { type: "number", name: "source_records", onlyInt: true },
        { type: "number", name: "target_records", onlyInt: true },
        { type: "text", name: "source_digest", pattern: "^[0-9a-f]{64}$" },
        { type: "text", name: "target_digest", pattern: "^[0-9a-f]{64}$" },
        { type: "bool", name: "verified" },
      ],
      indexes: [
        "CREATE UNIQUE INDEX `idx_migration_tables_run_source` ON `migration_tables` (`migration_run_id`, `source_table`)",
      ],
    });
    app.save(migrationTables);
  },
  (app) => {
    for (const name of [
      "migration_tables",
      "migration_audit",
      "app_services",
    ]) {
      try {
        app.delete(app.findCollectionByNameOrId(name));
      } catch (_) {}
    }
    try {
      const users = app.findCollectionByNameOrId("users");
      for (const name of [
        "supabase_id",
        "full_name",
        "avatar_url",
        "username",
        "website",
        "migration_source_json",
        "migration_source_hash",
        "migration_run_id",
      ]) {
        users.fields.removeByName(name);
      }
      users.indexes = users.indexes.filter(
        (index) => !index.includes("idx_users_supabase_id"),
      );
      app.save(users);
    } catch (_) {}
  },
);
