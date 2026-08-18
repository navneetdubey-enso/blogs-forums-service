import {
  applyDecorators,
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';
import type { Request } from 'express';
import type { AppUserIdentity } from '../../modules/users/users.service';

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

function readIdentity(
  request: ServiceAuthenticatedRequest,
  required: true,
): AppUserIdentity;
function readIdentity(
  request: ServiceAuthenticatedRequest,
  required: false,
): AppUserIdentity | undefined;
function readIdentity(
  request: ServiceAuthenticatedRequest,
  required: boolean,
): AppUserIdentity | undefined {
  const appType = request.serviceAuth?.projectCode;
  const appUserId = request.header('X-App-User-Id')?.trim();
  const universeUserId = request.header('X-Universe-User-Id')?.trim();
  const appUserRole = request.header('X-App-User-Role')?.trim();

  if (!required && !appUserId && !universeUserId && !appUserRole) {
    return undefined;
  }

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
}

function identityHeaders(required: boolean) {
  return applyDecorators(
    ApiHeader({
      name: 'X-App-User-Id',
      required,
      description: 'Application user identifier from the calling application',
    }),
    ApiHeader({
      name: 'X-Universe-User-Id',
      required,
      description: 'Universe user id from the calling application',
      schema: { type: 'string', example: '12345' },
    }),
    ApiHeader({
      name: 'X-App-User-Role',
      required,
      description: 'Application user role from the calling application',
      schema: { type: 'string', example: 'AGENT' },
    }),
  );
}

export const OptionalUserIdentity = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AppUserIdentity | undefined => {
    return readIdentity(
      ctx.switchToHttp().getRequest<ServiceAuthenticatedRequest>(),
      false,
    );
  },
);

export const UserIdentity = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AppUserIdentity => {
    return readIdentity(
      ctx.switchToHttp().getRequest<ServiceAuthenticatedRequest>(),
      true,
    );
  },
);

export const ApiOptionalUserIdentityHeaders = () => identityHeaders(false);
export const ApiUserIdentityHeaders = () => identityHeaders(true);
