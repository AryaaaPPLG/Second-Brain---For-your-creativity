/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class SimpleCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private ttl: number;

  constructor(ttl: number = 5 * 60 * 1000) {
    // Default 5 minutes
    this.ttl = ttl;
  }

  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }
}

export const apiCache = new SimpleCache(10 * 60 * 1000); // 10 minutes TTL for API responses
