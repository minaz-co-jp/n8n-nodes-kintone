# V1 Specification

## Principles

1. Keep kintone REST API semantics visible.
2. Do not aggregate n8n input items implicitly.
3. Do not auto-split requests over API limits.
4. Do not auto-convert values except for structural wrapping required by the API.
5. Preserve kintone API responses without flattening or custom success wrappers.
6. Validate obvious structural errors before calling kintone.
7. Leave app/business-rule validation to kintone.
8. Treat `undefined` as an input error; preserve explicit `""`, `null`, `[]`, `0`, and `false`.

## Authentication

- Base URL: HTTPS only; no API path.
- API Tokens: 1–9 tokens.
- Duplicate tokens are invalid.
- Guest Space ID is a node parameter, not a credential property.
- Credential-only connection tests are intentionally omitted because API tokens are app-scoped.

## Record

### Get
- App ID
- Guest Space ID optional
- Record ID

### Create
- App ID
- Guest Space ID optional
- `record` object
- Empty record object is allowed.

### Update
- App ID
- Guest Space ID optional
- exactly one of Record ID / Update Key
- `record` object with at least one field
- Revision optional; omitted by default; `-1` is passed explicitly if selected.

## Records

### Get
- App ID
- Query optional
- Fields optional
- Total Count optional
- Query syntax is not parsed by this node.

### Create
- `records[]` is user-supplied.
- 1–100 items.
- The node never aggregates n8n input items automatically.

### Update
- `records[]` is user-supplied.
- 1–100 items.
- Each element specifies exactly one of `id` / `updateKey`.
- Mixed ID and Update Key entries are allowed in the same request.
- `upsert` is explicit.
- Revision is per record and optional.

## Process Management

- Update Record Status
- Update Records Status
- Update Assignees

Action availability, assignee validity, permissions and revision conflicts are validated by kintone.

## Field Mapping Roadmap

V1 target UX includes:
- App Fields
- Manual Fields
- Raw JSON

App Fields will be loaded only when the user explicitly requests field retrieval. No automatic refresh is performed.

Field metadata to retain:
- field code
- label
- type
- required
- unique
- options
- lookup metadata
- group path
- form order
- subtable structure
- writable/read-only state
- retrieval metadata

Changing App ID, Guest Space ID or Credential invalidates saved App Fields metadata.

## Field UI

Display format:

`Group > Label (field_code) [TYPE]`

Always show field code and field type.

State labels include:
- REQUIRED
- READ ONLY
- CREATE ONLY
- PROCESS MANAGEMENT
- LOOKUP
- LOOKUP COPY / READ ONLY
- AUTO CALC / READ ONLY
- FILE / NOT SUPPORTED IN V1
- SYSTEM / READ ONLY
- FIELD NOT FOUND
- TYPE CHANGED

## Lookup

- Lookup source fields are writable.
- Lookup copy destination fields are read-only in App Fields mode.
- Referenced-app API tokens may be required.
- The node does not fetch referenced app settings just to validate uniqueness.

## File

- Read is supported through record responses.
- Upload/update helpers are not supported in V1.
- App Fields mode marks FILE as `NOT SUPPORTED IN V1`.
- Manual/Raw input is not forcibly blocked.

## Subtable

Target V1 UX:
- GUI rows
- Expression / JSON rows
- multiple subtables
- Row ID optional
- writable child fields shown in each GUI row
- explicit send/not-send state per field

Rules:
- Existing row can be sent as `{ id }` to preserve it.
- New row requires at least one field.
- Duplicate Row IDs are invalid.
- Existing rows omitted from a table update may be removed by kintone; the UI must warn.
- The node does not auto-fetch or auto-merge current rows.

## Validation

Node-side:
- positive integer App/Record/Guest IDs
- array/object structure
- 1–100 records limit
- duplicate field codes where detectable
- exactly one ID/Update Key on records update
- undefined values
- duplicate assignee codes
- malformed JSON

kintone-side:
- field permissions
- required-field business behavior
- option validity
- date/time validity
- numeric rules
- lookup resolution
- process action validity
- revision conflicts

## Errors

Custom validation errors must be bilingual (Japanese / English).

Structured error goal:
- source
- code
- Japanese message
- English message
- path
- HTTP status
- kintone code/message where available

Never expose:
- API tokens
- credentials
- request headers
- full request body by default

## Output

One output n8n item per input n8n item.  
API response structure is preserved.  
`records[]` responses are not automatically split into multiple n8n items.

## SDK

Use `@kintone/rest-api-client` direct methods only:
- getRecord
- addRecord
- updateRecord
- getRecords
- addRecords
- updateRecords
- updateRecordStatus
- updateRecordsStatus
- updateRecordAssignees

Do not use SDK convenience methods that automatically page, cursor, split, or bulk-process in V1.
