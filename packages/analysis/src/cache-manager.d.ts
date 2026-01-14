export declare class CacheManager {
    private cacheDir;
    constructor(baseDir?: string);
    getCachePath(key: string): string;
    has(key: string): boolean;
    read<T = unknown>(key: string): T | null;
    write(key: string, value: unknown): void;
}
//# sourceMappingURL=cache-manager.d.ts.map