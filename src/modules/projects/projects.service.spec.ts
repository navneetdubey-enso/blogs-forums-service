import { GatewayApiKeyService } from '../gateway-api-keys/gateway-api-key.service';
import { ProjectsService } from './projects.service';

describe('ProjectsService', () => {
  it('registers a project by reusing GatewayApiKeyService.generateProjectToken', async () => {
    const gatewayApiKeyService = {
      generateProjectToken: jest.fn().mockResolvedValue({
        projectCode: 'ACME',
        token: 'acme_gateway_example',
      }),
    };

    const projectsService = new ProjectsService(
      gatewayApiKeyService as unknown as GatewayApiKeyService,
    );

    await expect(projectsService.register('acme')).resolves.toEqual({
      projectCode: 'ACME',
      token: 'acme_gateway_example',
    });

    expect(gatewayApiKeyService.generateProjectToken).toHaveBeenCalledWith(
      'acme',
    );
  });
});
