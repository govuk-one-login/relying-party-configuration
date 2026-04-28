import { DynamoDBDocument, paginateScan } from "@aws-sdk/lib-dynamodb";
import {
  Client,
  ClientInput,
  ClientSummary,
  PaginatedClientSummary,
} from "../models/client";
import { randomBytes } from "crypto";

export class ClientService {
  dynamoClient: DynamoDBDocument;
  tableName: string;
  constructor(dynamo: DynamoDBDocument) {
    this.dynamoClient = dynamo;
    this.tableName = `${process.env.ENVIRONMENT ?? "test"}-client-registry`;
  }

  getClient = async (clientId: string): Promise<Client | undefined> => {
    const result = await this.dynamoClient.get({
      TableName: this.tableName,
      Key: { ClientID: clientId },
    });
    return result.Item as Client;
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
              ClientID: client.ClientID as string,
              ClientName: client.ClientName as string,
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

  createClient = async (clientInput: ClientInput): Promise<Client> => {
    return this.createClientWithId(
      randomBytes(20).toString("base64"),
      clientInput,
    );
  };

  createClientWithId = async (
    clientId: string,
    clientInput: ClientInput,
  ): Promise<Client> => {
    try {
      const client: Client = {
        ...clientInput,
        ClientID: clientId,
      };
      await this.dynamoClient.put({
        ConditionExpression: "attribute_not_exists(ClientID)",
        TableName: this.tableName,
        Item: client,
      });
      return client;
    } catch (error) {
      throw new ClientServiceError("Failed to create client", error as Error);
    }
  };

  updateClient = async (clientId: string, clientUpdates: ClientInput) => {
    try {
      await this.dynamoClient.put({
        ConditionExpression: "attribute_exists(ClientID)",
        TableName: this.tableName,
        Item: {
          ...clientUpdates,
          ClientID: clientId,
        },
      });
      return {
        ...clientUpdates,
        ClientID: clientId,
      };
    } catch (error) {
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
