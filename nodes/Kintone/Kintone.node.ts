import type {
  IExecuteFunctions,
  IDataObject,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import {
  createKintoneClient,
  optionalPositiveInteger,
  parseCredentials,
  parseJsonArray,
  parseJsonObject,
  positiveInteger,
  validateMax100,
} from './helpers';

type RecordPayload = Record<string, { value: unknown }>;
type UpdateKey = { field: string; value: string | number };
type UpdateRecordPayload =
  | { id: string; record?: RecordPayload; revision?: string }
  | { updateKey: UpdateKey; record?: RecordPayload; revision?: string };

export class Kintone implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'kintone',
    name: 'kintone',
    group: ['input'],
    version: 1,
    description: 'Connect n8n workflows with the kintone REST API',
    defaults: { name: 'kintone' },
    inputs: [NodeConnectionTypes.Main],
    outputs: [NodeConnectionTypes.Main],
    usableAsTool: true,
    credentials: [{ name: 'kintoneApi', required: true }],
    properties: [
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          { name: 'Record', value: 'record' },
          { name: 'Records', value: 'records' },
          { name: 'Process Management', value: 'processManagement' },
        ],
        default: 'record',
      },
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['record'] } },
        options: [
          { name: 'Get', value: 'get', action: 'Get a record' },
          { name: 'Create', value: 'create', action: 'Create a record' },
          { name: 'Update', value: 'update', action: 'Update a record' },
        ],
        default: 'get',
      },
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['records'] } },
        options: [
          { name: 'Get', value: 'get', action: 'Get records' },
          { name: 'Create', value: 'create', action: 'Create records' },
          { name: 'Update', value: 'update', action: 'Update records' },
        ],
        default: 'get',
      },
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['processManagement'] } },
        options: [
          {
            name: 'Update Record Status',
            value: 'updateRecordStatus',
            action: 'Update a record status',
          },
          {
            name: 'Update Records Status',
            value: 'updateRecordsStatus',
            action: 'Update multiple record statuses',
          },
          {
            name: 'Update Assignees',
            value: 'updateAssignees',
            action: 'Update record assignees',
          },
        ],
        default: 'updateRecordStatus',
      },
      {
        displayName: 'App ID',
        name: 'appId',
        type: 'string',
        default: '',
        required: true,
        description: 'kintone App ID',
      },
      {
        displayName: 'Guest Space ID',
        name: 'guestSpaceId',
        type: 'string',
        default: '',
        description: 'Optional Guest Space ID',
      },
      {
        displayName: 'Record ID',
        name: 'recordId',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['record'],
            operation: ['get'],
          },
        },
      },
      {
        displayName: 'Record JSON',
        name: 'recordJson',
        type: 'json',
        default: '{}',
        displayOptions: {
          show: {
            resource: ['record'],
            operation: ['create'],
          },
        },
        description: 'The kintone record object, without the outer app/record wrapper',
      },
      {
        displayName: 'Update By',
        name: 'updateBy',
        type: 'options',
        options: [
          { name: 'Record ID', value: 'id' },
          { name: 'Update Key', value: 'updateKey' },
        ],
        default: 'id',
        displayOptions: {
          show: {
            resource: ['record'],
            operation: ['update'],
          },
        },
      },
      {
        displayName: 'Record ID',
        name: 'recordId',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['record'],
            operation: ['update'],
            updateBy: ['id'],
          },
        },
      },
      {
        displayName: 'Update Key Field',
        name: 'updateKeyField',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['record'],
            operation: ['update'],
            updateBy: ['updateKey'],
          },
        },
      },
      {
        displayName: 'Update Key Value',
        name: 'updateKeyValue',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['record'],
            operation: ['update'],
            updateBy: ['updateKey'],
          },
        },
      },
      {
        displayName: 'Record JSON',
        name: 'recordJson',
        type: 'json',
        default: '{}',
        displayOptions: {
          show: {
            resource: ['record'],
            operation: ['update'],
          },
        },
        description: 'Fields to update. At least one field is required.',
      },
      {
        displayName: 'Revision',
        name: 'revision',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['record'],
            operation: ['update'],
          },
        },
        description: 'Optional. Leave empty to omit revision validation; -1 explicitly disables it.',
      },
      {
        displayName: 'Query',
        name: 'query',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['records'],
            operation: ['get'],
          },
        },
        description: 'Raw kintone query string. Query syntax is validated by kintone.',
      },
      {
        displayName: 'Fields',
        name: 'fields',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['records'],
            operation: ['get'],
          },
        },
        description: 'Optional comma-separated field codes. Leave empty to omit the fields parameter.',
      },
      {
        displayName: 'Return Total Count',
        name: 'totalCount',
        type: 'boolean',
        default: false,
        displayOptions: {
          show: {
            resource: ['records'],
            operation: ['get'],
          },
        },
      },
      {
        displayName: 'Records JSON',
        name: 'recordsJson',
        type: 'json',
        default: '[]',
        required: true,
        displayOptions: {
          show: {
            resource: ['records'],
            operation: ['create', 'update'],
          },
        },
        description: 'The records array itself. The node does not aggregate input items automatically.',
      },
      {
        displayName: 'Upsert',
        name: 'upsert',
        type: 'boolean',
        default: false,
        displayOptions: {
          show: {
            resource: ['records'],
            operation: ['update'],
          },
        },
      },
      {
        displayName: 'Record ID',
        name: 'recordId',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['processManagement'],
            operation: ['updateRecordStatus', 'updateAssignees'],
          },
        },
      },
      {
        displayName: 'Action',
        name: 'action',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['processManagement'],
            operation: ['updateRecordStatus'],
          },
        },
      },
      {
        displayName: 'Assignee',
        name: 'assignee',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['processManagement'],
            operation: ['updateRecordStatus'],
          },
        },
        description: 'Optional assignee user code',
      },
      {
        displayName: 'Revision',
        name: 'revision',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['processManagement'],
            operation: ['updateRecordStatus', 'updateAssignees'],
          },
        },
      },
      {
        displayName: 'Records JSON',
        name: 'statusRecordsJson',
        type: 'json',
        default: '[]',
        required: true,
        displayOptions: {
          show: {
            resource: ['processManagement'],
            operation: ['updateRecordsStatus'],
          },
        },
        description: 'Array of { id, action, assignee?, revision? } objects',
      },
      {
        displayName: 'Assignees',
        name: 'assigneesJson',
        type: 'json',
        default: '[]',
        required: true,
        displayOptions: {
          show: {
            resource: ['processManagement'],
            operation: ['updateAssignees'],
          },
        },
        description: 'Array of kintone user codes. An empty array is allowed.',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const inputItems = this.getInputData();
    const outputItems: INodeExecutionData[] = [];
    const rawCredentials = await this.getCredentials('kintoneApi');
    const credentials = parseCredentials(rawCredentials);

    for (let itemIndex = 0; itemIndex < inputItems.length; itemIndex++) {
      try {
        const resource = this.getNodeParameter('resource', itemIndex) as string;
        const operation = this.getNodeParameter('operation', itemIndex) as string;
        const app = positiveInteger(this.getNodeParameter('appId', itemIndex), 'App ID');
        const guestSpaceId = optionalPositiveInteger(
          this.getNodeParameter('guestSpaceId', itemIndex, ''),
          'Guest Space ID',
        );
        const client = createKintoneClient(credentials, guestSpaceId);

        let response: unknown;

        if (resource === 'record') {
          if (operation === 'get') {
            const id = positiveInteger(this.getNodeParameter('recordId', itemIndex), 'Record ID');
            response = await client.record.getRecord({ app, id });
          } else if (operation === 'create') {
            const record = parseJsonObject(
              this.getNodeParameter('recordJson', itemIndex, '{}'),
              'record',
            ) as unknown as RecordPayload;
            response = await client.record.addRecord({ app, record });
          } else if (operation === 'update') {
            const recordObject = parseJsonObject(
              this.getNodeParameter('recordJson', itemIndex, '{}'),
              'record',
            );
            if (Object.keys(recordObject).length === 0) {
              throw new Error(
                '更新するフィールドを1つ以上指定してください。 / Specify at least one field to update.',
              );
            }
            const record = recordObject as unknown as RecordPayload;
            const revisionValue = String(this.getNodeParameter('revision', itemIndex, '')).trim();
            const revision = revisionValue || undefined;
            const updateBy = this.getNodeParameter('updateBy', itemIndex) as string;

            if (updateBy === 'id') {
              const id = positiveInteger(this.getNodeParameter('recordId', itemIndex), 'Record ID');
              response = await client.record.updateRecord({
                app,
                id,
                record,
                ...(revision ? { revision } : {}),
              });
            } else {
              const field = String(this.getNodeParameter('updateKeyField', itemIndex, '')).trim();
              const value = this.getNodeParameter('updateKeyValue', itemIndex);
              if (!field) {
                throw new Error(
                  'Update Keyのフィールドコードを指定してください。 / Specify an Update Key field code.',
                );
              }
              if (value === undefined) {
                throw new Error(
                  'Update Keyの値を解決できませんでした。 / The Update Key value could not be resolved.',
                );
              }
              response = await client.record.updateRecord({
                app,
                updateKey: { field, value: String(value) },
                record,
                ...(revision ? { revision } : {}),
              });
            }
          }
        } else if (resource === 'records') {
          if (operation === 'get') {
            const query = String(this.getNodeParameter('query', itemIndex, '')).trim();
            const fieldText = String(this.getNodeParameter('fields', itemIndex, '')).trim();
            const fields = fieldText
              ? fieldText.split(',').map((field) => field.trim()).filter(Boolean)
              : undefined;
            if (fields && new Set(fields).size !== fields.length) {
              throw new Error(
                '同じフィールドコードを複数回指定することはできません。 / The same field code cannot be specified more than once.',
              );
            }
            const totalCount = this.getNodeParameter('totalCount', itemIndex, false) as boolean;
            response = await client.record.getRecords({
              app,
              ...(query ? { query } : {}),
              ...(fields?.length ? { fields } : {}),
              ...(totalCount ? { totalCount: true } : {}),
            });
          } else if (operation === 'create') {
            const records = parseJsonArray(
              this.getNodeParameter('recordsJson', itemIndex, '[]'),
              'records',
            );
            validateMax100(records, 'records');
            for (let index = 0; index < records.length; index++) {
              const record = records[index];
              if (!record || Array.isArray(record) || typeof record !== 'object') {
                throw new Error(
                  `${index + 1}件目のレコードが有効なオブジェクトではありません。 / Record ${index + 1} must be a valid object.`,
                );
              }
            }
            const addResult = await client.record.addRecords({
              app,
              records: records as unknown as RecordPayload[],
            });
            response = {
              ids: addResult.ids,
              revisions: addResult.revisions,
            };
          } else if (operation === 'update') {
            const records = parseJsonArray(
              this.getNodeParameter('recordsJson', itemIndex, '[]'),
              'records',
            );
            validateMax100(records, 'records');
            const validated: UpdateRecordPayload[] = records.map((record, index) => {
              const hasId = record.id !== undefined && String(record.id).trim() !== '';
              const hasUpdateKey = record.updateKey !== undefined;
              if (hasId === hasUpdateKey) {
                throw new Error(
                  `${index + 1}件目はRecord IDまたはUpdate Keyのどちらか一方を指定してください。 / Record ${index + 1} must specify either Record ID or Update Key, but not both.`,
                );
              }
              return record as unknown as UpdateRecordPayload;
            });
            const upsert = this.getNodeParameter('upsert', itemIndex, false) as boolean;
            response = await client.record.updateRecords({ app, records: validated, upsert });
          }
        } else if (resource === 'processManagement') {
          if (operation === 'updateRecordStatus') {
            const id = positiveInteger(this.getNodeParameter('recordId', itemIndex), 'Record ID');
            const action = String(this.getNodeParameter('action', itemIndex, '')).trim();
            if (!action) {
              throw new Error(
                '実行するアクションを指定してください。 / Specify an action to execute.',
              );
            }
            const assignee = String(this.getNodeParameter('assignee', itemIndex, '')).trim();
            const revisionValue = String(this.getNodeParameter('revision', itemIndex, '')).trim();
            response = await client.record.updateRecordStatus({
              app,
              id,
              action,
              ...(assignee ? { assignee } : {}),
              ...(revisionValue ? { revision: revisionValue } : {}),
            });
          } else if (operation === 'updateRecordsStatus') {
            const records = parseJsonArray(
              this.getNodeParameter('statusRecordsJson', itemIndex, '[]'),
              'records',
            );
            validateMax100(records, 'records');
            const statusRecords = records.map((record, index) => {
              const id = positiveInteger(record.id, `Record ${index + 1} ID`);
              const action = String(record.action ?? '').trim();
              if (!action) {
                throw new Error(
                  `${index + 1}件目のレコードにアクションを指定してください。 / Record ${index + 1} must specify an action.`,
                );
              }
              return {
                id,
                action,
                ...(record.assignee !== undefined && String(record.assignee).trim()
                  ? { assignee: String(record.assignee).trim() }
                  : {}),
                ...(record.revision !== undefined && String(record.revision).trim()
                  ? { revision: String(record.revision).trim() }
                  : {}),
              };
            });
            response = await client.record.updateRecordsStatus({ app, records: statusRecords });
          } else if (operation === 'updateAssignees') {
            const id = positiveInteger(this.getNodeParameter('recordId', itemIndex), 'Record ID');
            const parsedAssignees = parseJsonArray(
              this.getNodeParameter('assigneesJson', itemIndex, '[]'),
              'assignees',
            ) as unknown[];
            const assignees = parsedAssignees.map((value, index) => {
              if (typeof value !== 'string' || !value.trim()) {
                throw new Error(
                  `${index + 1}件目の作業者コードが空または文字列ではありません。 / Assignee code ${index + 1} must be a non-empty string.`,
                );
              }
              return value.trim();
            });
            if (new Set(assignees).size !== assignees.length) {
              throw new Error(
                '同じ作業者コードを複数回指定することはできません。 / The same assignee code cannot be specified more than once.',
              );
            }
            const revisionValue = String(this.getNodeParameter('revision', itemIndex, '')).trim();
            response = await client.record.updateRecordAssignees({
              app,
              id,
              assignees,
              ...(revisionValue ? { revision: revisionValue } : {}),
            });
          }
        }

        if (response === undefined) {
          throw new Error(
            `未対応の操作です: ${resource}/${operation} / Unsupported operation: ${resource}/${operation}`,
          );
        }

        outputItems.push({
          json: response as IDataObject,
          pairedItem: { item: itemIndex },
        });
      } catch (error) {
        const nodeError =
          error instanceof Error
            ? error
            : new Error(typeof error === 'string' ? error : JSON.stringify(error));

        if (this.continueOnFail()) {
          outputItems.push({
            json: {
              error: nodeError.message,
            },
            pairedItem: { item: itemIndex },
          });
          continue;
        }

        throw new NodeOperationError(this.getNode(), nodeError, { itemIndex });
      }
    }

    return [outputItems];
  }
}
