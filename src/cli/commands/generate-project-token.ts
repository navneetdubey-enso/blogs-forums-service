import { NestFactory } from '@nestjs/core';
import { ConflictException } from '@nestjs/common';
import { AppModule } from '../../app.module';
import { GatewayApiKeyService } from '../../modules/gateway-api-keys/gateway-api-key.service';

async function main() {
  const projectCode = process.argv[2];

  if (!projectCode?.trim()) {
    console.error('✗ Project code is required.');
    process.exitCode = 1;
    return;
  }

  let app;

  try {
    app = await NestFactory.createApplicationContext(AppModule);

    const service = app.get(GatewayApiKeyService);
    const result = await service.generateProjectToken(projectCode);

    console.log('✓ Project API key generated successfully');
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
    console.log(
      "- Add it to the consuming project's secret/environment configuration.",
    );
  } catch (error) {
    if (error instanceof ConflictException) {
      console.error(`✗ ${error.message}`);
    } else {
      console.error(
        `✗ ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    process.exitCode = 1;
  } finally {
    if (app) {
      await app.close();
    }
  }
}

void main();
