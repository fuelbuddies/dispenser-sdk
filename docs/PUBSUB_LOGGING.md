# Google Cloud Pub/Sub Logging for Dispenser SDK

This feature provides non-blocking, resilient message logging for dispenser communications using Google Cloud Pub/Sub with local caching for intermittent network connections.

## Features

- **Non-blocking Operations**: Logging runs in the background without blocking dispenser operations
- **Local Caching**: Messages are cached locally when network is unavailable
- **Automatic Retry**: Automatically retries sending cached messages when connection is restored
- **Batch Processing**: Efficiently sends messages in batches to reduce API calls
- **Memory Management**: Configurable cache size limits to prevent memory issues
- **Persistent Storage**: Cache survives process restarts

## Setup

### 1. Google Cloud Configuration

1. Create a Google Cloud Project
2. Enable the Pub/Sub API
3. Create a service account with Pub/Sub Publisher permissions
4. Download the service account JSON key file

### 2. Environment Configuration

Create a `.env` file with the following configuration:

```bash
# Google Cloud PubSub Configuration
GOOGLE_CLOUD_PROJECT=your-gcp-project-id
PUBSUB_TOPIC_NAME=dispenser-messages
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json

# PubSub Logger Configuration
PUBSUB_ENABLED=true
PUBSUB_CACHE_PATH=./.pubsub-cache
PUBSUB_MAX_CACHE_SIZE=10000
PUBSUB_RETRY_INTERVAL_MS=30000
PUBSUB_BATCH_SIZE=100

# Dispenser Configuration
DISPENSER_ID=dispenser-001
PUMP_ADDRESS=1
```

### 3. Code Implementation

```typescript
import { createDispenser, DispenserOptions } from '@fuelbuddy/dispenser-sdk';

const options: DispenserOptions = {
  dispenserType: 'GateX',
  dispenserId: 'dispenser-001',
  hardwareId: '2341',
  attributeId: '8036',
  pubsubConfig: {
    projectId: process.env.GOOGLE_CLOUD_PROJECT,
    topicName: 'dispenser-messages',
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    enabled: true,
    cachePath: './.pubsub-cache',
    maxCacheSize: 10000,
    retryIntervalMs: 30000,
    batchSize: 100
  }
};

const dispenser = await createDispenser(options);

// All dispenser communications are now automatically logged
await dispenser.executeWork('readStatus', 'processStatus');

// Gracefully shutdown
await dispenser.disconnect(() => console.log('Disconnected'));
```

## Message Format

Messages are published to Pub/Sub with the following structure:

```json
{
  "dispenserId": "dispenser-001",
  "dispenserType": "GateX",
  "messageType": "sent|received",
  "command": "readStatus",
  "data": "hex-encoded-data",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "metadata": {
    "pumpAddress": "1",
    "interByteTimeoutInterval": 500
  }
}
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `projectId` | string | - | Google Cloud Project ID |
| `topicName` | string | - | Pub/Sub topic name (created automatically if doesn't exist) |
| `keyFilename` | string | - | Path to service account JSON key |
| `enabled` | boolean | true | Enable/disable PubSub logging |
| `cachePath` | string | `./.pubsub-cache` | Directory for local message cache |
| `maxCacheSize` | number | 10000 | Maximum number of messages to cache |
| `retryIntervalMs` | number | 30000 | Retry interval for failed connections (ms) |
| `batchSize` | number | 100 | Number of messages to send per batch |

## Handling Intermittent Connections

The logger automatically handles network interruptions:

1. **Connection Lost**: Messages are queued in memory and saved to disk
2. **Cache Persistence**: Cache is written to disk after each message
3. **Automatic Retry**: Attempts to reconnect every `retryIntervalMs` milliseconds
4. **Queue Processing**: Sends cached messages in batches when reconnected
5. **Memory Management**: Oldest messages are dropped if cache exceeds `maxCacheSize`

## Monitoring

The PubSubLogger emits events for monitoring:

```typescript
import { getPubSubLogger } from '@fuelbuddy/dispenser-sdk';

const logger = getPubSubLogger();

logger.on('message-queued', (message) => {
  console.log('Message queued:', message.dispenserId);
});

logger.on('messages-published', (count) => {
  console.log(`Published ${count} messages`);
});

// Check status
console.log('Online:', logger.isOnline());
console.log('Queue size:', logger.getQueueSize());
```

## Testing

Run the test script to verify the setup:

```bash
npx env-cmd -f examples/.env.pubsub jest tests/pubsub-logger.test.ts
```

## Troubleshooting

### Messages not being sent

1. Check Google Cloud credentials are correctly configured
2. Verify the service account has Pub/Sub Publisher permissions
3. Check network connectivity
4. Enable debug logging: `DEBUG=dispenser:pubsub npm start`

### Cache growing too large

1. Reduce `maxCacheSize` to limit memory usage
2. Decrease `retryIntervalMs` for more frequent retry attempts
3. Monitor queue size with `logger.getQueueSize()`

### Topic not found

The topic is created automatically if it doesn't exist. Ensure the service account has permissions to create topics, or create the topic manually in GCP Console.

## Best Practices

1. **Graceful Shutdown**: Always call `disconnect()` to flush pending messages
2. **Monitor Queue Size**: Track queue size in production to detect issues
3. **Set Appropriate Limits**: Configure `maxCacheSize` based on available memory
4. **Use Batch Processing**: Larger batch sizes reduce API calls but increase latency
5. **Handle Sensitive Data**: Consider encrypting message data before logging

## Security Considerations

1. Store service account keys securely
2. Use least-privilege permissions for service accounts
3. Consider using Application Default Credentials in production
4. Implement message encryption for sensitive data
5. Regularly rotate service account keys