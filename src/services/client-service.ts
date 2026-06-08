import { DynamoDBDocument, paginateScan } from "@aws-sdk/lib-dynamodb";
import {
  Client,
  ClientSummary,
  PaginatedClientSummary,
} from "../models/client";
import { logger } from "../logger";

export class ClientService {
  dynamoClient: DynamoDBDocument;
  tableName: string;
  constructor(dynamo: DynamoDBDocument, tablePrefix = process.env.ENVIRONMENT) {
    this.dynamoClient = dynamo;
    this.tableName = `${tablePrefix ?? "test"}-client-registry`;
  }

  getClient = async (clientId: string): Promise<Client | undefined> => {
    const result = await this.dynamoClient.get({
      TableName: this.tableName,
      Key: { ClientID: clientId },
    });
    return result.Item as Client;
  };

  /**
   * We aren't entirely sure how this method will be used at the moment.
   * RPAT and orch will likely not use it, but fraud might to get a list of client IDs and names.
   * We may need to refine this in the future and decide whether we need the totalClients/totalPages fields.
   */
  getClientSummaries = async (
    pageNumber = 1,
    pageSize = 20,
  ): Promise<PaginatedClientSummary> => {
    const paginator = paginateScan(
      {
        client: this.dynamoClient,
        pageSize,
      },
      {
        TableName: this.tableName,
        ProjectionExpression: "ClientID, ClientName",
      },
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
              ClientID: client.ClientID as string,
              ClientName: client.ClientName as string,
            };
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

  putClient = async (client: Client): Promise<Client> => {
    try {
      const createdTime = Math.floor(Date.now() / 1000);
      const clientWithUpdatedTimes: Client = {
        ...client,
        ClientID: client.ClientID,
        Created: createdTime,
        LastModified: createdTime,
      };
      await this.dynamoClient.put({
        ConditionExpression: "attribute_not_exists(ClientID)",
        TableName: this.tableName,
        Item: clientWithUpdatedTimes,
      });
      return clientWithUpdatedTimes;
    } catch (error) {
      logger.error(`Failed to create client: ${(error as Error).message}`);
      throw new ClientServiceError("Failed to create client", error as Error);
    }
  };

  updateClient = async (clientToUpdate: Client) => {
    // TODO: Perform validation on client updates
    try {
      const updatedTime = Math.floor(Date.now() / 1000);
      const updatedClient = {
        ...clientToUpdate,
        ClientID: clientToUpdate.ClientID,
        LastModified: updatedTime,
      };
      await this.dynamoClient.put({
        ConditionExpression: "attribute_exists(ClientID)",
        TableName: this.tableName,
        Item: updatedClient,
      });
      return updatedClient;
    } catch (error) {
      logger.error(`Failed to update client: ${(error as Error).message}`);
      throw new ClientServiceError("Failed to update client", error as Error);
    }
  };
}

export class ClientServiceError extends Error {
  constructor(message: string, cause: Error) {
    super(message, {
      cause,
    });
  }
}
