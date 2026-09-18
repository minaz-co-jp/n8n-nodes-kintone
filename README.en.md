# n8n-nodes-kintone

Unofficial n8n Community Node for the kintone REST API. This project is not an official product of Cybozu, Inc.

The project aims to preserve kintone REST API semantics while providing an n8n-friendly interface for humans, MCP clients, and AI-generated workflows.

## V1 scope

- Record: Get / Create / Update
- Records: Get / Create / Update / Upsert
- Process Management: Update Record Status / Update Records Status / Update Assignees
- API Token authentication
- Multiple API tokens
- Guest Spaces

Not in V1: record deletion, attachment upload helpers, direct Cursor resource, automatic pagination, automatic chunking, automatic retries.

See [README.md](./README.md) for the Japanese documentation and [docs/spec-v1.md](./docs/spec-v1.md) for the implementation specification.
