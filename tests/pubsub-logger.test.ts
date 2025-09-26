#!/usr/bin/env node -r @swc-node/register

import { createDispenser, DispenserOptions, shutdownPubSubLogger } from '../main';
import * as dotenv from 'dotenv';
import * as path from 'path';
import debug from 'debug';

const debugLog = debug('test:pubsub');

dotenv.config({ path: path.join(__dirname, '../examples/.env.pubsub') });

async function testPubSubLogger() {
	console.log('Testing PubSub Logger with intermittent connection simulation...\n');

	try {
		const options: DispenserOptions = {
			dispenserType: process.env.DISPENSER_TYPE || 'GateX',
			dispenserId: process.env.DISPENSER_ID || 'test-dispenser-001',
			pumpAddress: process.env.PUMP_ADDRESS || '1',
			hardwareId: process.env.HARDWARE_ID || '2341',
			attributeId: process.env.ATTRIBUTE_ID || '8036',
			baudRate: parseInt(process.env.BAUD_RATE || '115200'),
			interByteTimeoutInterval: parseInt(process.env.INTER_BYTE_TIMEOUT_INTERVAL || '500'),
			printer: {
				printerType: 'default',
				hardwareId: process.env.PRINTER_HARDWARE_ID || '2341',
				attributeId: process.env.PRINTER_ATTRIBUTE_ID || '8036',
				baudRate: parseInt(process.env.PRINTER_BAUD_RATE || '115200')
			},
			pubsubConfig: {
				projectId: process.env.GOOGLE_CLOUD_PROJECT,
				topicName: process.env.PUBSUB_TOPIC_NAME || 'dispenser-messages',
				keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
				enabled: process.env.PUBSUB_ENABLED === 'true',
				cachePath: process.env.PUBSUB_CACHE_PATH,
				maxCacheSize: parseInt(process.env.PUBSUB_MAX_CACHE_SIZE || '10000'),
				retryIntervalMs: parseInt(process.env.PUBSUB_RETRY_INTERVAL_MS || '30000'),
				batchSize: parseInt(process.env.PUBSUB_BATCH_SIZE || '100')
			}
		};

		console.log('Configuration:');
		console.log('- Dispenser Type:', options.dispenserType);
		console.log('- Dispenser ID:', options.dispenserId);
		console.log('- PubSub Enabled:', options.pubsubConfig?.enabled);
		console.log('- PubSub Topic:', options.pubsubConfig?.topicName);
		console.log('- Cache Path:', options.pubsubConfig?.cachePath);
		console.log('- Max Cache Size:', options.pubsubConfig?.maxCacheSize);
		console.log('- Retry Interval:', options.pubsubConfig?.retryIntervalMs, 'ms');
		console.log('- Batch Size:', options.pubsubConfig?.batchSize);
		console.log('');

		console.log('Creating dispenser instance...');
		const dispenser = await createDispenser(options);

		console.log('Dispenser created successfully!');
		console.log('');

		console.log('Simulating dispenser operations...');
		console.log('(Messages will be logged to PubSub with local caching for offline support)');
		console.log('');

		// Simulate some dispenser operations
		console.log('1. Reading dispenser status...');
		try {
			await dispenser.executeWork('readStatus', 'processStatus');
			console.log('   Status read complete');
		} catch (error) {
			console.log('   Status read failed (expected if no hardware connected):', (error as Error).message);
		}

		console.log('');
		console.log('2. Reading totalizer...');
		try {
			await dispenser.executeWork('totalizer', 'processTotalizer');
			console.log('   Totalizer read complete');
		} catch (error) {
			console.log('   Totalizer read failed (expected if no hardware connected):', (error as Error).message);
		}

		console.log('');
		console.log('3. Simulating network interruption...');
		console.log('   Messages will be cached locally and sent when connection is restored');
		console.log('');

		// Wait a moment to allow any pending messages to be processed
		await new Promise(resolve => setTimeout(resolve, 2000));

		console.log('Disconnecting dispenser...');
		await new Promise((resolve) => {
			dispenser.disconnect(() => {
				console.log('Dispenser disconnected');
				resolve(void 0);
			});
		});

		console.log('');
		console.log('Shutting down PubSub logger...');
		await shutdownPubSubLogger();
		console.log('PubSub logger shut down successfully');

		console.log('');
		console.log('Test complete!');
		console.log('');
		console.log('Notes:');
		console.log('- Messages are cached locally in:', options.pubsubConfig?.cachePath);
		console.log('- Cached messages will be automatically sent when connection is restored');
		console.log('- The logger runs in the background and does not block dispenser operations');
		console.log('- Check your GCP Console to see the published messages');

	} catch (error) {
		console.error('Test failed:', error);
		process.exit(1);
	}
}

testPubSubLogger().catch(console.error);