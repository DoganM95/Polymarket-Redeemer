/**
 * Secure Key Management System
 * Encrypts sensitive data using AES-256-GCM
 */

import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import type { EncryptedKeys, EncryptedData } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const POLYGON_RPC_PROVIDERS_DOCS =
  'https://docs.polygon.technology/pos/reference/rpc-endpoints/#infrastructure-providers';

function isValidHttpsRpcUrl(raw: string): boolean {
  const s = raw.trim();
  if (!s.startsWith('https://')) {
    return false;
  }
  try {
    const u = new URL(s);
    return u.protocol === 'https:' && Boolean(u.hostname);
  } catch {
    return false;
  }
}

function readWindowsClipboard(): string {
  try {
    const buf = execFileSync(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', 'Get-Clipboard -Raw'],
      { encoding: 'utf8', maxBuffer: 65536, windowsHide: true }
    );
    return buf.replace(/\ufeff/g, '').replace(/\r\n/g, '\n').trim();
  } catch {
    return '';
  }
}

/**
 * Windows CMD often does not deliver Ctrl+V to Node readline. If the user
 * typed @paste, substitute the current clipboard contents.
 */
function applyWindowsPasteShortcut(line: string): string {
  const t = line.trim();
  if (process.platform === 'win32' && /^@paste$/i.test(t)) {
    return readWindowsClipboard();
  }
  return line;
}

const WIN_CMD_PASTE_HINT =
  '\n  (CMD: try Shift+Insert, or right-click. If Ctrl+V does nothing, copy the value, type @paste, then Enter.)';

class KeyManager {
  private keyFile: string;
  private algorithm: string;
  private keyLength: number;
  private ivLength: number;

  constructor() {
    this.keyFile = path.join(__dirname, '..', '.encrypted_keys');
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32;
    this.ivLength = 16;
  }

  /**
   * Derive encryption key from password using PBKDF2
   */
  private deriveKey(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(password, salt, 100000, this.keyLength, 'sha256');
  }

  /**
   * Encrypt sensitive data using AES-256-GCM
   */
  private encrypt(data: EncryptedKeys, password: string): EncryptedData {
    const salt = crypto.randomBytes(32);
    const key = this.deriveKey(password, salt);
    const iv = crypto.randomBytes(this.ivLength);

    const cipher = crypto.createCipheriv(this.algorithm, key, iv) as crypto.CipherGCM;
    cipher.setAAD(salt);

    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    return {
      salt: salt.toString('hex'),
      iv: iv.toString('hex'),
      encrypted,
      tag: tag.toString('hex')
    };
  }

  /**
   * Decrypt sensitive data using AES-256-GCM
   */
  private decrypt(encryptedData: EncryptedData, password: string): EncryptedKeys {
    const { salt, iv, encrypted, tag } = encryptedData;

    const saltBuffer = Buffer.from(salt, 'hex');
    const ivBuffer = Buffer.from(iv, 'hex');
    const tagBuffer = Buffer.from(tag, 'hex');

    const key = this.deriveKey(password, saltBuffer);

    const decipher = crypto.createDecipheriv(this.algorithm, key, ivBuffer) as crypto.DecipherGCM;
    decipher.setAAD(saltBuffer);
    decipher.setAuthTag(tagBuffer);

    try {
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return JSON.parse(decrypted) as EncryptedKeys;
    } catch {
      throw new Error('Invalid password or corrupted key file');
    }
  }

  /**
   * Store encrypted keys to file
   */
  storeKeys(keys: EncryptedKeys, password: string): void {
    const encrypted = this.encrypt(keys, password);
    fs.writeFileSync(this.keyFile, JSON.stringify(encrypted, null, 2));
    
    // Set restrictive permissions (ignore errors on Windows)
    try {
      fs.chmodSync(this.keyFile, 0o600);
    } catch {
      // Ignore on Windows
    }
  }

  /**
   * Load encrypted keys from file
   */
  loadKeys(password: string): EncryptedKeys {
    if (!fs.existsSync(this.keyFile)) {
      throw new Error('Key file not found. Run setup first.');
    }

    const encryptedData = JSON.parse(
      fs.readFileSync(this.keyFile, 'utf8')
    ) as EncryptedData;
    
    return this.decrypt(encryptedData, password);
  }

  /**
   * Create readline interface for user input
   */
  private createReadline(): readline.Interface {
    return readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  /**
   * Ask a question and get user input
   */
  private ask(rl: readline.Interface, question: string): Promise<string> {
    return new Promise((resolve) => {
      rl.question(question, (answer) => resolve(answer));
    });
  }

  /**
   * Like ask(), with optional Windows hint for fields where paste is common.
   */
  private askWithOptionalPasteHint(
    rl: readline.Interface,
    question: string,
    showWinPasteHint: boolean
  ): Promise<string> {
    const q =
      showWinPasteHint && process.platform === 'win32'
        ? `${question}${WIN_CMD_PASTE_HINT}\n`
        : question;
    return this.ask(rl, q);
  }

  /**
   * Ask a question with hidden input (for passwords)
   * Shows asterisks instead of the actual characters
   */
  private askHidden(question: string): Promise<string> {
    return new Promise((resolve) => {
      const stdin = process.stdin;
      const stdout = process.stdout;
      
      stdout.write(question);
      
      // Set raw mode to capture individual keystrokes
      stdin.setRawMode(true);
      stdin.resume();
      stdin.setEncoding('utf8');
      
      let input = '';

      const finish = () => {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener('data', onData);
        stdout.write('\n');
        resolve(input);
      };

      const onData = (chunk: string | Buffer) => {
        const s = typeof chunk === 'string' ? chunk : chunk.toString('utf8');
        for (const char of s) {
          if (char === '\r' || char === '\n') {
            finish();
            return;
          }
          if (char === '\x7f' || char === '\b') {
            if (input.length > 0) {
              input = input.slice(0, -1);
              stdout.write('\b \b');
            }
            continue;
          }
          if (char === '\x03') {
            stdin.setRawMode(false);
            stdin.pause();
            stdin.removeListener('data', onData);
            stdout.write('\n');
            process.exit(0);
          }
          input += char;
          stdout.write('*');
        }
      };

      stdin.on('data', onData);
    });
  }

  /**
   * Setup wizard for first-time key storage
   */
  async setupWizard(): Promise<EncryptedKeys> {
    const rl = this.createReadline();

    try {
      console.log('Secure Key Setup Wizard');
      console.log('==========================');
      console.log('');
      console.log(
        'Polygon public RPC (polygon-rpc.com) is deprecated. Pick an HTTPS endpoint from:'
      );
      console.log(`  ${POLYGON_RPC_PROVIDERS_DOCS}`);
      console.log('');

      let rpcUrl = '';
      while (!isValidHttpsRpcUrl(rpcUrl)) {
        rpcUrl = await this.ask(
          rl,
          'Enter your Polygon PoS RPC URL (https://...): '
        );
        if (!isValidHttpsRpcUrl(rpcUrl)) {
          console.log(
            'Invalid URL: use an https:// JSON-RPC endpoint from the providers list above.'
          );
        }
      }

      let privateKey = '';
      while (!privateKey.trim()) {
        const line = await this.askWithOptionalPasteHint(
          rl,
          'Enter your wallet private key:',
          true
        );
        privateKey = applyWindowsPasteShortcut(line);
        if (/^@paste$/i.test(line.trim()) && !privateKey.trim()) {
          console.log('Clipboard was empty. Copy your private key, then type @paste and Enter again.');
        } else if (!privateKey.trim()) {
          console.log('Private key is required.');
        }
      }

      let funderAddress = '';
      while (!funderAddress.trim()) {
        const line = await this.askWithOptionalPasteHint(
          rl,
          'Enter your Polymarket proxy wallet address:',
          true
        );
        funderAddress = applyWindowsPasteShortcut(line);
        if (/^@paste$/i.test(line.trim()) && !funderAddress.trim()) {
          console.log('Clipboard was empty. Copy the address, then type @paste and Enter again.');
        } else if (!funderAddress.trim()) {
          console.log('Proxy wallet address is required.');
        }
      }
      const apiKey = await this.ask(rl, 'Enter your Builder API key: ');
      const apiSecret = await this.ask(rl, 'Enter your Builder API secret: ');
      const apiPassphrase = await this.ask(rl, 'Enter your Builder API passphrase: ');

      console.log('\nPassword Protection Setup');
      rl.close(); // Close readline before using raw mode for hidden input
      const password = await this.askHidden('Create a password to encrypt your keys: ');
      const confirmPassword = await this.askHidden('Confirm password: ');

      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      const keys: EncryptedKeys = {
        privateKey: privateKey.trim() as `0x${string}`,
        funderAddress: funderAddress.trim() as `0x${string}`,
        apiKey: apiKey.trim(),
        apiSecret: apiSecret.trim(),
        apiPassphrase: apiPassphrase.trim(),
        rpcUrl: rpcUrl.trim()
      };

      this.storeKeys(keys, password);

      console.log('[OK] Keys encrypted and stored securely!');
      console.log('Key file created:', this.keyFile);

      return keys;
    } catch (error) {
      rl.close();
      throw error;
    }
  }

  /**
   * Get keys (with password prompt if needed)
   */
  async getKeys(password: string | null = null): Promise<EncryptedKeys> {
    if (!password) {
      const pwd = await this.askHidden('Enter your encryption password: ');
      return this.loadKeys(pwd);
    } else {
      return this.loadKeys(password);
    }
  }

  /**
   * Check if keys are already set up
   */
  isSetup(): boolean {
    return fs.existsSync(this.keyFile);
  }

  /**
   * Reset/delete encrypted keys file
   */
  reset(): boolean {
    if (fs.existsSync(this.keyFile)) {
      fs.unlinkSync(this.keyFile);
      console.log('[OK] Encrypted keys file deleted');
      return true;
    } else {
      console.log('[INFO] No keys file found to delete');
      return false;
    }
  }
}

export default new KeyManager();

