import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class CKAN implements ICredentialType {
	name = 'ckanApi';

	displayName = 'CKAN API';

	documentationUrl =
		'https://docs.ckan.org/en/latest/maintaining/configuration.html#api-token-settings';

	properties: INodeProperties[] = [
		{
			displayName: 'API Token',
			name: 'apiToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'Your CKAN API token. Generate one from your user profile page under Manage → API Tokens.',
		},
		{
			displayName: 'Authorization Header Name',
			name: 'authorizationHeaderName',
			type: 'string',
			default: 'Authorization',
			required: false,
			description:
				'The HTTP header used to send your API token. Defaults to "Authorization". Only change this if your CKAN instance has been configured with a custom apitoken_header_name.',
		},
	];
}
