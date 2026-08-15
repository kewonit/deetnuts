"""
validates structured JEE source and knowledge JSON under data/
mirrors packages/data/src/schemas/jee.ts
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator, model_validator

ROOT = Path(__file__).resolve().parents[5]
DATA_ROOT = ROOT / "data"
JEE_JSON_ROOTS = [
    DATA_ROOT / "sources" / "engineering",
    DATA_ROOT / "knowledge" / "engineering",
]


class Source(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1)
    kind: Literal["pdf", "html"]
    exam: str | None = Field(default=None, pattern=r"^[a-z0-9-]+$")
    year: int | None = Field(default=None, ge=2000, le=2100)
    title: str = Field(min_length=1)
    url: HttpUrl
    publisher: str = Field(min_length=1)


class SourcesRegistry(BaseModel):
    model_config = ConfigDict(extra="forbid")

    schema_version: int = Field(alias="$schema_version", gt=0)
    description: str = Field(min_length=1)
    policy: dict[str, Any]
    sources: list[Source] = Field(min_length=1)

    @field_validator("policy")
    @classmethod
    def validate_policy(cls, policy: dict[str, Any]) -> dict[str, Any]:
        origins = policy.get("allowed_origins")
        disallowed = policy.get("disallowed")
        if not isinstance(origins, list) or not origins:
            raise ValueError("policy.allowed_origins must be a non-empty list")
        if not isinstance(disallowed, str) or not disallowed:
            raise ValueError("policy.disallowed must be a non-empty string")
        return policy

    @model_validator(mode="after")
    def unique_source_ids(self) -> SourcesRegistry:
        ids = [source.id for source in self.sources]
        if len(ids) != len(set(ids)):
            raise ValueError("duplicate source.id")
        return self


class ExamDocument(BaseModel):
    model_config = ConfigDict(extra="allow")

    id: str = Field(pattern=r"^[a-z0-9-]+$")
    name: str = Field(min_length=1)
    abbreviation: str = Field(min_length=1)
    conducting_body: str = Field(min_length=1)
    official_url: HttpUrl


class CitedDocument(BaseModel):
    model_config = ConfigDict(extra="allow")

    description: str = Field(min_length=1)
    source: str = Field(min_length=1)


class IitsCatalog(CitedDocument):
    count: int = Field(gt=0)
    iits: list[dict[str, Any]] = Field(min_length=1)

    @model_validator(mode="after")
    def count_matches_iits(self) -> IitsCatalog:
        if len(self.iits) != self.count:
            raise ValueError("iits.length must equal count")
        for iit in self.iits:
            if not isinstance(iit.get("name"), str) or not iit["name"]:
                raise ValueError("each iit must have a non-empty name")
            established = iit.get("established")
            if not isinstance(established, int) or established < 1850 or established > 2030:
                raise ValueError("each iit must have a valid established year")
            if not isinstance(iit.get("location"), str) or not iit["location"]:
                raise ValueError("each iit must have a non-empty location")
        return self


class CounsellingAuthority(BaseModel):
    model_config = ConfigDict(extra="allow")

    id: str = Field(pattern=r"^[a-z0-9-]+$")
    name: str = Field(min_length=1)
    abbreviation: str = Field(min_length=1)
    conducting_body: str = Field(min_length=1)
    official_url: HttpUrl
    source: str = Field(min_length=1)


class BusinessRulesDocument(BaseModel):
    model_config = ConfigDict(extra="allow")

    description: str = Field(min_length=1)
    source: str = Field(min_length=1)


SchemaEntry = tuple[re.Pattern[str], type[BaseModel], str]

FILE_SCHEMAS: list[SchemaEntry] = [
    (re.compile(r"/sources/engineering/jee\.json$"), SourcesRegistry, "sources-registry"),
    (re.compile(r"/exams/jee-main\.json$"), ExamDocument, "jee-main-exam"),
    (re.compile(r"/jee-main/syllabus\.json$"), CitedDocument, "syllabus"),
    (re.compile(r"/jee-main/exam-cities\.json$"), CitedDocument, "exam-cities"),
    (re.compile(r"/exams/jee-advanced\.json$"), ExamDocument, "jee-advanced-exam"),
    (re.compile(r"/jee-advanced/subject-details\.json$"), CitedDocument, "subject-details"),
    (re.compile(r"/jee-advanced/policies\.json$"), CitedDocument, "policies"),
    (re.compile(r"/jee-advanced/programmes\.json$"), CitedDocument, "programmes-index"),
    (re.compile(r"/jee-advanced/iits\.json$"), IitsCatalog, "iits-catalog"),
    (re.compile(r"/(josaa|csab)/authority\.json$"), CounsellingAuthority, "counselling-authority"),
    (re.compile(r"/(josaa|csab)/business-rules\.json$"), BusinessRulesDocument, "business-rules"),
]


def walk_json_files() -> list[Path]:
    files: list[Path] = []
    for root in JEE_JSON_ROOTS:
        if not root.exists():
            continue
        for path in sorted(root.rglob("*.json")):
            files.append(path)
    return files


def collect_source_refs(node: Any, path: list[str], hits: list[tuple[str, str]]) -> None:
    if isinstance(node, dict):
        for key, value in node.items():
            if key == "source" and isinstance(value, str):
                hits.append((value, ".".join([*path, key])))
            else:
                collect_source_refs(value, [*path, key], hits)
    elif isinstance(node, list):
        for index, value in enumerate(node):
            collect_source_refs(value, [*path, str(index)], hits)


def validate_json_files() -> int:
    failed = 0
    ok = 0
    skipped = 0
    parsed: list[tuple[str, Any, str]] = []

    for file_path in walk_json_files():
        rel = file_path.relative_to(ROOT).as_posix()
        norm = f"/{rel}"
        match = next(((pattern, model, kind) for pattern, model, kind in FILE_SCHEMAS if pattern.search(norm)), None)
        if match is None:
            print(f"SKIP  {rel}  (no schema mapped)")
            skipped += 1
            continue

        _, model, kind = match
        try:
            raw = json.loads(file_path.read_text())
        except json.JSONDecodeError as exc:
            print(f"FAIL  {rel}  invalid JSON: {exc.msg}")
            failed += 1
            continue

        try:
            data = model.model_validate(raw)
        except Exception as exc:
            print(f"FAIL  {rel}  ({kind})")
            print(f"        {exc}")
            failed += 1
            continue

        print(f"OK    {rel}  ({kind})")
        parsed.append((rel, data.model_dump(by_alias=True) if hasattr(data, "model_dump") else data, kind))
        ok += 1

    registry = next((data for rel, data, kind in parsed if kind == "sources-registry"), None)
    if registry is None:
        print("FAIL  no sources registry parsed; cannot run citation check")
        failed += 1
    else:
        known = {source["id"] for source in registry["sources"]}
        citation_fails = 0
        for rel, data, kind in parsed:
            if kind == "sources-registry":
                continue
            hits: list[tuple[str, str]] = []
            collect_source_refs(data, [], hits)
            for source_id, hit_path in hits:
                if source_id not in known:
                    print(f"FAIL  {rel}  unknown source.id \"{source_id}\" at {hit_path}")
                    citation_fails += 1
        failed += citation_fails

    print(f"\nsummary: {ok} ok, {failed} fail, {skipped} skip")
    return 1 if failed else 0


def main() -> int:
    if not any(root.exists() for root in JEE_JSON_ROOTS):
        roots = ", ".join(str(root) for root in JEE_JSON_ROOTS)
        print(f"no jee json directories at {roots}")
        return 0
    return validate_json_files()


if __name__ == "__main__":
    sys.exit(main())
