# n8n-nodes-kintone

> 非公式の n8n Community Node です。サイボウズ株式会社が提供・保証する公式製品ではありません。

[English](./README.en.md)

kintone REST API を n8n から扱うための OSS Community Node です。  
API の構造や挙動をできるだけ維持しつつ、n8n / MCP / AI から扱いやすい UX を目指します。

## V1 スコープ

### Record
- Get
- Create
- Update

### Records
- Get
- Create
- Update / Upsert

### Process Management
- Update Record Status
- Update Records Status
- Update Assignees

### 対応
- API Token 認証
- 複数 API Token
- Guest Space
- Raw JSON 入力
- Record / Records の明示的な使い分け
- kintone 公式 `@kintone/rest-api-client`

### V1 で未対応
- Record Delete
- 添付ファイルのアップロード
- Cursor の直接操作
- 自動ページング
- 100 件超の自動分割
- 独自の自動リトライ

## Credentials

Credential には以下を設定します。

- Base URL
- API Tokens（1〜9 個、改行またはカンマ区切り）

Lookup フィールドを利用する場合、参照先アプリの API Token も必要になることがあります。

## Record と Records の違い

このノードでは `Record` と `Records` を意図的に分けます。

- `Record`: 1件 API をそのまま利用
- `Records`: 複数件 API をそのまま利用

単に件数の違いではなく、Webhook など kintone 側の挙動差を利用者が明示的に選べるようにするためです。

ノードは複数の n8n Items を暗黙的に `records[]` にまとめません。

## Query

`Records > Get` の Query は kintone のクエリ文字列をそのまま渡します。  
ノード側で独自のクエリパーサーや補正は行いません。

公式: https://cybozu.dev/ja/kintone/docs/overview/query/

## API 仕様

- 認証: https://cybozu.dev/ja/kintone/docs/rest-api/overview/authentication/
- フィールド形式: https://cybozu.dev/ja/kintone/docs/overview/field-types/
- レコード API: https://cybozu.dev/ja/kintone/docs/rest-api/records/

詳細な V1 仕様は [docs/spec-v1.md](./docs/spec-v1.md) を参照してください。

## 開発

```bash
npm install
npm run typecheck
npm run lint
npm run build
```

Node.js 20 以上が必要です。

## Contributing

[CONTRIBUTING.md](./CONTRIBUTING.md) を参照してください。

## Security

API Token や実データを Issue / Pull Request に投稿しないでください。  
詳細は [SECURITY.md](./SECURITY.md) を参照してください。

## License

MIT

## Trademark

`kintone` はサイボウズ株式会社の商標または登録商標です。名称・ロゴの公開利用については、公開前に公式ガイドラインおよび必要な許諾を確認します。
