import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
	NodeApiError,
	NodeConnectionTypes,
	NodeOperationError,
} from 'n8n-workflow';
import { buildRequest, buildNodeProperties, operationOptions } from './actions/operations';
import { ckanApiRequest, healthCheck } from './actions/transport';

const trimUrl = (url: string) => url.replace(/\/+$/, '');

export class Ckan implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'CKAN',
		name: 'ckan',
		icon: { light: 'file:ckan.svg', dark: 'file:ckan.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Interact with the CKAN API',
		defaults: { name: 'CKAN' },
		credentials: [
			{
				name: 'ckanApi',
				required: false,
			},
		],
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		outputNames: ['CKAN Response'],
		properties: [
			{
				displayName: 'CKAN URL',
				name: 'ckanUrl',
				type: 'string',
				validateType: 'url',
				required: true,
				default: '',
				placeholder: 'https://demo.ckan.org',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: operationOptions,
				default: 'package_search',
			},
			...buildNodeProperties(),
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const operation = this.getNodeParameter('operation', 0) as string;
		const ckanUrl = trimUrl(this.getNodeParameter('ckanUrl', 0) as string);

		await healthCheck(this, operation, ckanUrl);

		// Fetch credentials once — only needed for POST operations
		const creds = await this.getCredentials('ckanApi').catch(() => null);
		const authToken = creds?.apiToken as string | undefined;
		const authHeaderName = (creds?.authorizationHeaderName as string) || 'Authorization';

		for (let i = 0; i < items.length; i++) {
			try {
				const req = buildRequest(this, operation, i);

				const response = await ckanApiRequest(
					this,
					req.method,
					operation,
					req.body,
					req.qs,
					trimUrl(this.getNodeParameter('ckanUrl', i) as string),
					req.method === 'POST' ? authToken : undefined,
					authHeaderName,
				);

				if (!response?.success) {
					throw new NodeOperationError(
						this.getNode(),
						response?.error?.message ?? 'CKAN request failed',
					);
				}

				returnData.push({
					json: { success: true, data: response.result as object },
					pairedItem: { item: i },
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
					continue;
				}
				throw new NodeApiError(this.getNode(), error as JsonObject);
			}
		}

		return [returnData];
	}
}
