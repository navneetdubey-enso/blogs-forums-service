import {
  applyDecorators,
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';
import type { Request } from 'express';
import type { AppUserIdentity } from './users.service';

type ServiceAuthenticatedRequest = Request & {
  serviceAuth?: {
    projectCode: string;
  };
};

function parseUniverseUserId(value: string) {
  if (!/^[1-9]\d*$/.test(value)) {
    throw new BadRequestException(
      'X-Universe-User-Id must be a numeric Universe user id',
    );
  }

  const universeUserId = Number(value);
  if (!Number.isSafeInteger(universeUserId)) {
    throw new BadRequestException(
      'X-Universe-User-Id must be a numeric Universe user id',
    );
  }

  return universeUserId;
}

export const UserIdentity = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AppUserIdentity => {
    const request = ctx
      .switchToHttp()
      .getRequest<ServiceAuthenticatedRequest>();
    const appType = request.serviceAuth?.projectCode;
    const appUserId = request.header('X-App-User-Id')?.trim();
    const universeUserId = request.header('X-Universe-User-Id')?.trim();
    const appUserRole = request.header('X-App-User-Role')?.trim();

    if (!appType) {
      throw new UnauthorizedException('Service authentication token required');
    }

    if (!appUserId || !universeUserId || !appUserRole) {
      throw new BadRequestException(
        'X-App-User-Id, X-Universe-User-Id, and X-App-User-Role headers are required',
      );
    }

    return {
      appType,
      appUserId,
      universeUserId: parseUniverseUserId(universeUserId),
      appUserRole,
    };
  },
);

export const ApiUserIdentityHeaders = () =>
  applyDecorators(
    ApiHeader({
      name: 'X-App-User-Id',
      required: true,
      description: 'Application user identifier from the calling application',
    }),
    ApiHeader({
      name: 'X-Universe-User-Id',
      required: true,
      description: 'Universe user id from the calling application',
      schema: { type: 'string', example: '12345' },
    }),
    ApiHeader({
      name: 'X-App-User-Role',
      required: true,
      description: 'Application user role from the calling application',
      schema: { type: 'string', example: 'AGENT' },
    }),
  );
