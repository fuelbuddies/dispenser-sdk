# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Build and Development
- `npm run build` - Compile TypeScript and copy shell scripts to dist/
- `npm run clean` - Remove dist directory
- `npm run pub` - Clean, build, and bump version (for publishing)
- `npm test` - Run Jest tests (currently configured to run only GateX tests)

### Testing Specific Dispensers
To test other dispensers, modify jest.config.js testMatch pattern or run:
```bash
npx jest tests/TCS3000.test.ts
npx jest tests/IsoilVegaTVersion10.test.ts
npx jest tests/Tokhiem.test.ts
```

### CLI Tools
Run CLI tools with environment configuration:
```bash
npx env-cmd -f examples/.env.gatex ./.bin/read-totalizer.ts
npx env-cmd -f examples/.env.tcs3000 ./.bin/read-status.ts
npx env-cmd -f examples/.env.vegat ./.bin/authorize.ts
```

## Architecture Overview

### Dispenser System Design
The SDK implements a factory pattern with interface-based design for hardware abstraction:

1. **Factory Functions** (main.ts): `createDispenser()` and `createRfid()` dynamically instantiate appropriate hardware classes based on type
2. **Interface Contracts**: All dispensers implement `IDispenser`, all RFID readers implement `IRfid`
3. **Base Classes**: Common functionality in `BaseDispenser` and `ModBusDispenser` for code reuse
4. **Hardware Detection**: Automatic USB port discovery via hardware/attribute IDs

### Supported Hardware Types
- **Dispensers**: Tokhiem, VeederEmr4, IsoilVegaTVersion10, TCS3000, GateX
- **RFID**: RfidPetropoint
- **Printers**: Required for TCS3000 and GateX dispensers

### Communication Architecture
- Serial port communication using `serialport` library with InterByteTimeoutParser
- ModBus protocol support via `modbus-serial` for compatible dispensers
- Queue-based command processing to handle concurrent operations
- Promise-based async API with timeout handling

### Key Design Patterns
1. **Command Queue**: Each dispenser maintains a command queue to serialize hardware operations
2. **Event-Driven Processing**: RxJS observables for handling asynchronous data streams
3. **Response Validation**: CRC/checksum validation for data integrity
4. **Automatic Retries**: Built-in retry logic for failed commands

## Development Notes

### TypeScript Configuration
- Strict mode enabled
- Target: ES2016
- Module: CommonJS
- Output: dist/ directory with type definitions

### Testing Approach
- Jest with SWC transformer for fast test execution
- Individual test files per dispenser type in tests/
- Environment-based configuration for hardware testing

### Hardware Communication
- Always check USB port availability before operations
- Handle serial port timeouts (default 5000ms)
- Validate CRC/checksums for TCS3000 and similar protocols
- Process duplicate responses appropriately (especially TCS3000)

### Adding New Dispenser Types
1. Create new class extending `BaseDispenser` or `ModBusDispenser`
2. Implement all `IDispenser` interface methods
3. Add case in `createDispenser()` factory function
4. Create test file in tests/ directory
5. Add example .env configuration in examples/