import { Injectable } from "@nestjs/common";
import { mkdir, writeFile, unlink, readFile } from "fs/promises";
import { dirname, join, resolve } from "path";

/** Swap this contract for an R2/S3 driver later without touching callers. */
export abstract class StorageService {
  abstract put(key: string, data: Buffer): Promise<void>;
  abstract get(key: string): Promise<Buffer>;
  abstract delete(key: string): Promise<void>;
}

@Injectable()
export class LocalStorageService extends StorageService {
  private root = resolve(process.env.STORAGE_LOCAL_DIR || "/var/data/st-erp/uploads");

  private safe(key: string) {
    const p = resolve(this.root, key);
    if (!p.startsWith(this.root)) throw new Error("Invalid storage key"); // no path traversal
    return p;
  }
  async put(key: string, data: Buffer) {
    const p = this.safe(key);
    await mkdir(dirname(p), { recursive: true });
    await writeFile(p, data);
  }
  get(key: string) { return readFile(this.safe(key)); }
  async delete(key: string) { await unlink(this.safe(key)).catch(() => undefined); }
}
