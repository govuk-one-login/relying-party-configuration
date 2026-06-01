# relying-party-configuration

Use `npm ci` to install packages.

## Tests

### Integration

Integration tests are found in the `integration-tests` folder.

If you want to run the integration tests locally, you can run the following commands:

```sh
npm run dynamodblocal:up     # Starts DynamoDBLocal in its own container
npm run build                # Builds the API GW
npm run start:local          # Starts the API GW locally
npm run test:integration
npm run dynamodblocal:down
```

## Development

You should install the [pre-commit](http://pre-commit.com/) config by running `pre-commit install` in the root of the repository.

To run this API locally, you can run the following commands:

```sh
npm run dynamodblocal:up
./scripts/create-local-table.sh   # Note that you only need to do this once
npm run build
npm run start:local
```

You can then hit the endpoints shown in the output of the `start:local` script. The base URL should be something along the lines of `http://127.0.0.1:3000`
