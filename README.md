# relying-party-configuration

Use npm ci to install packages.

## Tests

### Integration
Integration tests are found in the `integration-tests` folder. To run the integration tests locally:

```sh
npm install
npm run dynamodblocal:up     # Starts DynamoDBLocal in its own container
npm run build
npm run start:local:api      # Starts the API GW locally
npm run test:integration
```