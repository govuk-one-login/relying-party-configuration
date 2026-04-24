# relying-party-configuration

Use `npm ci` to install packages.

## Tests

### Integration

Integration tests are found in the `integration-tests` folder.

If you want to run the integration tests locally, you can run the following commands:

```sh
npm run dynamodblocal:up     # Starts DynamoDBLocal in its own container
npm run build                # Builds the API GW
npm run start:local:api      # Starts the API GW locally
npm run test:integration
npm run dynamodblocal:down
```

## Development

You should install the [pre-commit](http://pre-commit.com/) config by running `pre-commit install` in the root of the repository.
