# 🚀 Development Guide

## Project Architecture

```
CMD-STORE/
├── config/              # Configuration modules
├── modules/             # Feature modules
├── utils/               # Utility functions
├── tests/               # Test files
├── logs/                # Application logs
├── cache/               # Temporary cache
└── assets/              # Static assets
```

## Code Style Guide

### JavaScript Standards

- Use ES6+ features
- Follow Airbnb style guide
- Use async/await over callbacks
- Document functions with JSDoc

### Naming Conventions

```javascript
// Variables and functions: camelCase
const userData = {};
function getUserData() {}

// Classes and constructors: PascalCase
class CacheManager {}

// Constants: UPPER_SNAKE_CASE
const MAX_RETRIES = 5;
const API_TIMEOUT = 5000;
```

### Documentation

All functions must have JSDoc comments:

```javascript
/**
 * Brief description of function
 * 
 * @param {type} paramName - Parameter description
 * @returns {type} - Return value description
 * @throws {Error} - Error conditions
 * @example
 * const result = functionName(param);
 */
function functionName(paramName) {
  // implementation
}
```

## Creating a New Module

### 1. Create Module Directory

```bash
mkdir -p modules/mymodule
```

### 2. Create Module Files

```javascript
// modules/mymodule/index.js
const handler = require('./handler');
const config = require('./config');

module.exports = { handler, config };
```

### 3. Implement Handler

```javascript
// modules/mymodule/handler.js
const logger = require('../../config/logger');
const { AppError } = require('../../utils/errorHandler');

async function handleMyModule(params) {
  try {
    // Implementation
    return { success: true, data: params };
  } catch (error) {
    logger.error('Module error:', error);
    throw new AppError(error.message, 500);
  }
}

module.exports = { handleMyModule };
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- mytest.test.js

# Run with coverage
npm test -- --coverage
```

### Writing Tests

```javascript
// tests/mymodule.test.js
const { handleMyModule } = require('../modules/mymodule/handler');

describe('MyModule', () => {
  test('should handle request successfully', async () => {
    const result = await handleMyModule({ test: true });
    expect(result.success).toBe(true);
  });

  test('should throw error on invalid input', async () => {
    await expect(handleMyModule(null)).rejects.toThrow();
  });
});
```

## Linting and Formatting

```bash
# Run ESLint
npm run lint

# Fix linting issues
npm run lint:fix
```

## Database Operations

### Connecting to Database

```javascript
const { connectDB, getCollection } = require('../../config/database');

const db = await connectDB(process.env.MONGO_URI, 'SIZUKA');
const collection = await getCollection(db, 'myvideos');
```

### Common Operations

```javascript
// Insert document
await collection.insertOne({ key: 'value' });

// Find documents
const docs = await collection.find({ status: 'active' }).toArray();

// Update document
await collection.updateOne(
  { _id: id },
  { $set: { updated: true } }
);

// Delete document
await collection.deleteOne({ _id: id });
```

## Error Handling

```javascript
const { AppError, handleError } = require('./utils/errorHandler');

try {
  // Some operation
  if (!valid) {
    throw new AppError('Invalid input', 400);
  }
} catch (error) {
  const response = handleError(error);
  logger.error(response);
}
```

## Logging

```javascript
const logger = require('./config/logger');

logger.info('Information message');
logger.warn('Warning message');
logger.error('Error message', error);
debug('Debug message'); // Only in dev
```

## Performance Tips

1. **Use Caching**: Cache frequently accessed data
   ```javascript
   const cache = require('./utils/cache');
   cache.set('key', value, 3600); // 1 hour TTL
   ```

2. **Batch Operations**: Batch multiple database operations
   ```javascript
   const ops = items.map(item => ({
     insertOne: { document: item }
   }));
   await collection.bulkWrite(ops);
   ```

3. **Connection Pooling**: Already configured in database.js

4. **Async Processing**: Use async/await for non-blocking operations

## Debugging

### Debug Mode

```bash
# Run with debug logging
DEBUG=cmd-store:* npm run dev
```

### Node Inspector

```bash
node --inspect index.js
# Open chrome://inspect in Chrome
```

## Submitting Changes

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and commit: `git commit -m 'Add feature'`
3. Push to branch: `git push origin feature/my-feature`
4. Open Pull Request with clear description

## Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create git tag: `git tag v1.0.0`
4. Push tags: `git push origin --tags`
5. Create GitHub release
