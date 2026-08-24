if ($os.getenv("DEETNUTS_MIGRATION_MODE") === "1") {
  routerAdd(
    "POST",
    "/internal/migration/users",
    (e) => {
      const expectedKey = $os.getenv("DEETNUTS_MIGRATION_KEY");
      const receivedKey = e.request.header.get("X-DEETNUTS-MIGRATION-KEY");
      if (
        !expectedKey ||
        !receivedKey ||
        !$security.equal(
          $security.sha256(receivedKey),
          $security.sha256(expectedKey),
        )
      ) {
        throw e.forbiddenError("Migration authorization failed", null);
      }

      const data = new DynamicModel({
        id: "",
        supabase_id: "",
        email: "",
        verified: false,
        full_name: "",
        avatar_url: "",
        username: "",
        website: "",
        password_hash: "",
        migration_source_json: "",
        migration_source_hash: "",
        migration_run_id: "",
        google_identities: [],
      });
      e.bindBody(data);
      if (
        typeof data.id !== "string" ||
        !/^[a-z0-9]{15}$/.test(data.id) ||
        typeof data.supabase_id !== "string" ||
        typeof data.email !== "string" ||
        !data.email.includes("@") ||
        typeof data.verified !== "boolean" ||
        typeof data.migration_source_json !== "string" ||
        typeof data.migration_source_hash !== "string" ||
        !/^[0-9a-f]{64}$/.test(data.migration_source_hash) ||
        typeof data.migration_run_id !== "string" ||
        !/^[0-9a-f]{32}$/.test(data.migration_run_id) ||
        (data.password_hash && !/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(data.password_hash))
      ) {
        throw e.badRequestError("Invalid migration record", null);
      }

      const users = $app.findCollectionByNameOrId("users");
      const existing = $app.findRecordsByFilter(
        users,
        "supabase_id = {:supabaseId}",
        "",
        1,
        0,
        { supabaseId: data.supabase_id },
      );
      const record = existing.length ? existing[0] : new Record(users, { id: data.id });
      record.set("email", data.email.toLowerCase());
      record.set("emailVisibility", false);
      record.set("verified", data.verified);
      record.set("supabase_id", data.supabase_id);
      record.set("full_name", data.full_name || "");
      record.set("avatar_url", data.avatar_url || "");
      record.set("username", data.username || "");
      record.set("website", data.website || "");
      record.set("migration_source_json", data.migration_source_json);
      record.set("migration_source_hash", data.migration_source_hash);
      record.set("migration_run_id", data.migration_run_id);
      if (!existing.length) {
        record.set("password", $security.randomString(64));
      }
      $app.save(record);
      if (data.password_hash) {
        $app
          .db()
          .newQuery(
            'UPDATE "users" SET "password" = {:passwordHash} WHERE "id" = {:recordId}',
          )
          .bind({
            passwordHash: String(data.password_hash),
            recordId: record.id,
          })
          .execute();
      }

      const identities = Array.isArray(data.google_identities)
        ? data.google_identities
        : [];
      for (const providerId of identities) {
        if (typeof providerId !== "string" || !providerId || providerId.length > 255) {
          throw e.badRequestError("Invalid external identity", null);
        }
        const matches = $app.findRecordsByFilter(
          "_externalAuths",
          "collectionRef = {:collectionRef} && provider = 'google' && providerId = {:providerId}",
          "",
          1,
          0,
          { collectionRef: users.id, providerId },
        );
        if (!matches.length) {
          const externalAuth = new Record(
            $app.findCollectionByNameOrId("_externalAuths"),
            {
              collectionRef: users.id,
              recordRef: record.id,
              provider: "google",
              providerId,
            },
          );
          $app.save(externalAuth);
        } else if (matches[0].getString("recordRef") !== record.id) {
          throw e.badRequestError("External identity collision", null);
        }
      }

      return e.json(200, { id: record.id });
    },
    $apis.bodyLimit(1024 * 1024),
    $apis.requireSuperuserAuth(),
  );
}
