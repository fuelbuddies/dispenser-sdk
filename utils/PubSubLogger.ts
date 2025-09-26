import { PubSub, Topic } from '@google-cloud/pubsub';
import debug from 'debug';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

const debugLog = debug('dispenser:pubsub');

export interface MessagePayload {
	dispenserId: string;
	dispenserType: string;
	messageType: 'sent' | 'received';
	command?: string;
	data: Buffer | string;
	timestamp: Date;
	metadata?: Record<string, any>;
}

export interface PubSubConfig {
	projectId?: string;
	topicName: string;
	keyFilename?: string;
	cachePath?: string;
	maxCacheSize?: number;
	retryIntervalMs?: number;
	batchSize?: number;
	enabled?: boolean;
}

type RequiredPubSubConfig = Required<Omit<PubSubConfig, 'keyFilename'>> & {
	keyFilename?: string;
};

export class PubSubLogger extends EventEmitter {
	private pubsub: PubSub | null = null;
	private topic: Topic | null = null;
	private messageQueue: MessagePayload[] = [];
	private cachePath: string;
	private isConnected: boolean = false;
	private retryTimer: NodeJS.Timeout | null = null;
	private config: RequiredPubSubConfig;
	private isProcessing: boolean = false;
	private failedAttempts: number = 0;

	constructor(config: PubSubConfig) {
		super();
		this.config = {
			projectId: config.projectId || process.env.GOOGLE_CLOUD_PROJECT || '',
			topicName: config.topicName,
			keyFilename: config.keyFilename || process.env.GOOGLE_APPLICATION_CREDENTIALS || undefined,
			cachePath: config.cachePath || path.join(process.cwd(), '.pubsub-cache'),
			maxCacheSize: config.maxCacheSize || 10000,
			retryIntervalMs: config.retryIntervalMs || 30000,
			batchSize: config.batchSize || 100,
			enabled: config.enabled !== false
		};

		this.cachePath = path.join(this.config.cachePath, 'messages.json');

		if (this.config.enabled) {
			this.initialize();
		}
	}

	private async initialize(): Promise<void> {
		try {
			await this.ensureCacheDirectory();
			await this.loadCachedMessages();

			if (this.config.projectId && this.config.topicName) {
				this.pubsub = new PubSub({
					projectId: this.config.projectId,
					keyFilename: this.config.keyFilename
				});

				this.topic = this.pubsub.topic(this.config.topicName);

				const [exists] = await this.topic.exists();
				if (!exists) {
					debugLog('Topic does not exist, creating: %s', this.config.topicName);
					await this.topic.create();
				}

				this.isConnected = true;
				debugLog('Connected to PubSub topic: %s', this.config.topicName);

				this.startProcessingQueue();
			} else {
				debugLog('PubSub configuration incomplete, running in offline mode');
			}
		} catch (error) {
			debugLog('Failed to initialize PubSub: %O', error);
			this.isConnected = false;
			this.scheduleRetry();
		}
	}

	private async ensureCacheDirectory(): Promise<void> {
		const dir = path.dirname(this.cachePath);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}
	}

	private async loadCachedMessages(): Promise<void> {
		try {
			if (fs.existsSync(this.cachePath)) {
				const data = fs.readFileSync(this.cachePath, 'utf-8');
				const cached = JSON.parse(data);

				if (Array.isArray(cached)) {
					this.messageQueue = cached.map(msg => ({
						...msg,
						timestamp: new Date(msg.timestamp),
						data: msg.data.type === 'Buffer' ? Buffer.from(msg.data.data) : msg.data
					}));
					debugLog('Loaded %d cached messages', this.messageQueue.length);
				}
			}
		} catch (error) {
			debugLog('Failed to load cached messages: %O', error);
			this.messageQueue = [];
		}
	}

	private async saveCacheToFile(): Promise<void> {
		try {
			const recentMessages = this.messageQueue.slice(-this.config.maxCacheSize);
			fs.writeFileSync(this.cachePath, JSON.stringify(recentMessages, null, 2));
		} catch (error) {
			debugLog('Failed to save cache: %O', error);
		}
	}

	public async logMessage(message: MessagePayload): Promise<void> {
		if (!this.config.enabled) {
			return;
		}

		this.messageQueue.push(message);
		this.emit('message-queued', message);

		setImmediate(() => {
			this.saveCacheToFile().catch(err =>
				debugLog('Background cache save failed: %O', err)
			);
		});

		if (this.isConnected && !this.isProcessing) {
			this.processQueue();
		}
	}

	private async processQueue(): Promise<void> {
		if (this.isProcessing || this.messageQueue.length === 0 || !this.isConnected) {
			return;
		}

		this.isProcessing = true;

		try {
			const messagesToSend = this.messageQueue.splice(0, this.config.batchSize);

			const publishPromises = messagesToSend.map(async (msg) => {
				const messageBuffer = Buffer.from(JSON.stringify({
					...msg,
					data: Buffer.isBuffer(msg.data) ? msg.data.toString('hex') : msg.data
				}));

				const messageId = await this.topic!.publishMessage({
					data: messageBuffer,
					attributes: {
						dispenserId: msg.dispenserId,
						dispenserType: msg.dispenserType,
						messageType: msg.messageType,
						timestamp: msg.timestamp.toISOString()
					}
				});

				return { messageId, message: msg };
			});

			const results = await Promise.allSettled(publishPromises);

			const failed = results.filter(r => r.status === 'rejected');
			if (failed.length > 0) {
				debugLog('Failed to publish %d messages', failed.length);

				const failedMessages = messagesToSend.slice(-failed.length);
				this.messageQueue.unshift(...failedMessages);

				this.failedAttempts++;
				if (this.failedAttempts >= 3) {
					this.isConnected = false;
					this.scheduleRetry();
				}
			} else {
				this.failedAttempts = 0;
				const successful = results.filter(r => r.status === 'fulfilled').length;
				debugLog('Published %d messages to PubSub', successful);
				this.emit('messages-published', successful);
			}

			await this.saveCacheToFile();

		} catch (error) {
			debugLog('Error processing queue: %O', error);
			this.isConnected = false;
			this.scheduleRetry();
		} finally {
			this.isProcessing = false;

			if (this.messageQueue.length > 0 && this.isConnected) {
				setImmediate(() => this.processQueue());
			}
		}
	}

	private startProcessingQueue(): void {
		if (this.messageQueue.length > 0) {
			debugLog('Starting to process %d queued messages', this.messageQueue.length);
			this.processQueue();
		}
	}

	private scheduleRetry(): void {
		if (this.retryTimer) {
			return;
		}

		debugLog('Scheduling retry in %dms', this.config.retryIntervalMs);
		this.retryTimer = setTimeout(async () => {
			this.retryTimer = null;
			debugLog('Retrying PubSub connection...');

			try {
				if (this.topic) {
					const [exists] = await this.topic.exists();
					if (exists) {
						this.isConnected = true;
						this.failedAttempts = 0;
						debugLog('Reconnected to PubSub');
						this.startProcessingQueue();
						return;
					}
				}

				await this.initialize();
			} catch (error) {
				debugLog('Retry failed: %O', error);
				this.scheduleRetry();
			}
		}, this.config.retryIntervalMs);
	}

	public getQueueSize(): number {
		return this.messageQueue.length;
	}

	public isOnline(): boolean {
		return this.isConnected;
	}

	public async flush(): Promise<void> {
		if (this.isConnected) {
			while (this.messageQueue.length > 0) {
				await this.processQueue();
				await new Promise(resolve => setTimeout(resolve, 1000));
			}
		}
	}

	public async shutdown(): Promise<void> {
		debugLog('Shutting down PubSub logger');

		if (this.retryTimer) {
			clearTimeout(this.retryTimer);
			this.retryTimer = null;
		}

		await this.flush();
		await this.saveCacheToFile();

		if (this.pubsub) {
			await this.pubsub.close();
		}

		this.removeAllListeners();
	}
}

let singletonLogger: PubSubLogger | null = null;

export function getPubSubLogger(config?: PubSubConfig): PubSubLogger {
	if (!singletonLogger && config) {
		singletonLogger = new PubSubLogger(config);
	}

	if (!singletonLogger) {
		throw new Error('PubSubLogger not initialized. Please provide configuration on first call.');
	}

	return singletonLogger;
}

export async function shutdownPubSubLogger(): Promise<void> {
	if (singletonLogger) {
		await singletonLogger.shutdown();
		singletonLogger = null;
	}
}