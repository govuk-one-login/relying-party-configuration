import { DynamoDBDocument, paginateScan } from "@aws-sdk/lib-dynamodb";
import {
  Client,
  ClientSummary,
  PaginatedClientSummary,
} from "../models/client";

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
  ): Promise<PaginatedClientSummary> => {
    const paginator = paginateScan(
      {
        client: this.dynamoClient,
      },
      { TableName: this.tableName, Limit: pageSize },
    );
    let pageCount = 0;
    let totalClients = 0;
    let clients: ClientSummary[] = [];
    for await (const page of paginator) {
      pageCount++;
      totalClients += page.Items?.length ?? 0;
      if (pageCount === pageNumber) {
        clients =
          page.Items?.map((client) => {
            return {
              ClientID: client.ClientID,
              ClientName: client.ClientName,
            } as ClientSummary;
          }) ?? [];
      }
    }
    return {
      pageNumber,
      pageSize,
      totalPages: pageCount,
      totalClients,
      clients,
    };
  };
}
