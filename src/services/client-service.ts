import { DynamoDBDocument, paginateScan } from "@aws-sdk/lib-dynamodb";
import { Client, ClientSummary } from "../models/client";

export class ClientService {
  dynamoClient: DynamoDBDocument;
  tableName: string;
  constructor(dynamo: DynamoDBDocument) {
    this.dynamoClient = dynamo;
    this.tableName = `${process.env.ENVIRONMENT}-client-registry`;
  }
  getClient = async (clientId: string): Promise<Client | undefined> => {
    const result = await this.dynamoClient.get({
      TableName: this.tableName,
      Key: { ClientID: clientId },
    });
    return result?.Item as Client;
  };
  getClientSummaries = async (
    pageNumber = 1,
    pageSize = 20,
  ): Promise<ClientSummary[]> => {
    const paginator = paginateScan(
      {
        client: this.dynamoClient,
      },
      { TableName: this.tableName, Limit: pageSize },
    );
    let pageCount = 0;

    for await (const page of paginator) {
      pageCount++;
      if (pageCount === pageNumber) {
        return (
          page.Items?.map((client) => {
            return {
              ClientID: client.ClientID,
              ClientName: client.ClientName,
            } as ClientSummary;
          }) || []
        );
      }
    }
    return [];
  };
}
