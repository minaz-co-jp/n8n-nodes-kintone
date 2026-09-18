import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class KintoneApi implements ICredentialType {
  name = 'kintoneApi';

  displayName = 'kintone API Token';

  documentationUrl = 'https://cybozu.dev/ja/kintone/docs/rest-api/overview/authentication/';

  properties: INodeProperties[] = [
    {
      displayName: 'Base URL',
      name: 'baseUrl',
      type: 'string',
      default: '',
      placeholder: 'https://example.cybozu.com',
      required: true,
      description:
        'kintone environment base URL. HTTPS is required. Do not include /k/v1 or other API paths.',
    },
    {
      displayName: 'API Tokens',
      name: 'apiTokens',
      type: 'string',
      typeOptions: { password: true, rows: 4 },
      default: '',
      required: true,
      description:
        'Enter 1–9 API tokens separated by new lines or commas. Lookup fields may require tokens for referenced apps as well.',
    },
  ];
}
