import { DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

const host = "http://localhost:3000";
describe("Temp API test", () => {
  it("should call the API endpoint", async () => {
    const response: Response = await fetch(`${host}/temp-api`);
    expect(response.ok).toBe(true);
  });
});
describe("Localstack test", () => {
  it("should connect to localstack", async () => {
    const dynamoClient = new DynamoDBClient({
      region: process.env.AWS_REGION,
      endpoint: process.env.LOCALSTACK_ENDPOINT,
    });

    const docClient = DynamoDBDocument.from(dynamoClient);
    const tables = await docClient.send(new ListTablesCommand());
    expect(tables.TableNames).toBeDefined();
  });
});
