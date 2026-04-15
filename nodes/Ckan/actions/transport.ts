import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import { shouldSkipHealthCheck } from './operations';

export interface CkanResponse {
	success: boolean;
	result: unknown;
	error?: { message: string; __type: string };
}

const toBody = (o: IDataObject) => (Object.keys(o).length ? o : undefined);

export async function ckanApiRequest(
	ctx: IExecuteFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
	ckanUrl: string,
	authToken?: string,
	authHeaderName = 'Authorization',
): Promise<CkanResponse> {
	const url = `${ckanUrl.replace(/\/+$/, '')}/api/3/action/${endpoint}`;

	ctx.logger.debug(`CKAN API: ${method} ${url}`);

	try {
		let options: IHttpRequestOptions = {
			method,
			url,
			qs,
			body: toBody(body),
			headers: {
				'Content-Type': 'application/json',
			},
		};

		if (authToken) {
			options = {
				...options,
				headers: {
					[authHeaderName]: authToken,
				},
			};
		}

		return (await ctx.helpers.httpRequest(options)) as CkanResponse;
	} catch (error) {
		ctx.logger.error(`Error preparing CKAN API request: ${(error as Error).message}`);

		throw new NodeApiError(ctx.getNode(), error as JsonObject);
	}
}

export async function healthCheck(ctx: IExecuteFunctions, opName: string, url: string) {
	if (shouldSkipHealthCheck(opName)) return;
	const res = await ckanApiRequest(ctx, 'GET', 'status_show', {}, {}, url);
	if (!res?.success) {
		throw new NodeOperationError(
			ctx.getNode(),
			'CKAN instance is not reachable or returned an error on status_show.',
		);
	}
}
