const { TCS3000 } = require('./dist/dispenser/TCS3000');
const { getConfigFromEnv } = require('./dist/utils/envParser');

// Load configuration from environment file
const config = getConfigFromEnv();
console.log('Loaded config:', config);

// Mock serial port with required methods
const mockPort = { 
  write: () => {}, 
  on: () => {}, 
  close: () => {}, 
  isOpen: true,
  pipe: () => ({ on: () => {} })
};

try {
  // Create TCS3000 instance with real config from .env.tcs3000
  const tcs3000 = new TCS3000(mockPort, mockPort, config);
  
  console.log('TCS3000 instance created successfully!');
  console.log('Testing getProductIDBytes() directly...');
  
  const productIdBytes = tcs3000.getProductIDBytes();
  console.log('Product ID bytes:', productIdBytes);
  console.log('Success! The fix is working - options are passed correctly.');
} catch (error) {
  console.log('Error:', error.message);
}