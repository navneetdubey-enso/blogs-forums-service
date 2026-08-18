import { NestFactory } from '@nestjs/core';
import type { INestApplicationContext } from '@nestjs/common';
import { AppModule } from '../../app.module';
import { GatewayApiKeyService } from '../../modules/gateway-api-keys/gateway-api-key.service';

async function main() {
  const projectCode = process.argv[2];

  if (!projectCode?.trim()) {
    console.error('✗ Project code is required.');
    process.exitCode = 1;
    return;
  }

  let app: INestApplicationContext | undefined;

  try {
    app = await NestFactory.createApplicationContext(AppModule, {
      logger: false,
    });

    const service = app.get(GatewayApiKeyService);
    const result = await service.rotateProjectToken(projectCode);

    console.log('✓ Project API key rotated successfully');
    console.log('');
    console.log(`Project: ${result.projectCode}`);
    console.log('');
    console.log('Token:');
    console.log(result.token);
    console.log('');
    console.log('⚠ IMPORTANT:');
    console.log('- Store this token securely.');
    console.log('- The raw token is not stored in the database.');
    console.log('- This token will not be displayed again.');
  } catch (error) {
    console.error(
      `✗ ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
  } finally {
    if (app) {
      await app.close();
    }
  }
}

void main();
