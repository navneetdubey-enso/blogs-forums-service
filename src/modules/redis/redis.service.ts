import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor() {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      throw new Error('REDIS_URL is not configured');
    }

    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
    });
  }

  async getJson<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.client.get(key);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async setJson(key: string, value: unknown, ttlSeconds: number) {
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      return;
    }
  }

  async del(key: string) {
    try {
      await this.client.del(key);
    } catch {
      return;
    }
  }

  async delByPattern(pattern: string) {
    try {
      const stream = this.client.scanStream({
        match: pattern,
        count: 100,
      });

      const keys: string[] = [];

      for await (const chunk of stream) {
        const batch = (Array.isArray(chunk) ? chunk : [chunk]).filter(
          (key): key is string => typeof key === 'string',
        );
        keys.push(...batch);
      }

      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch {
      return;
    }
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
