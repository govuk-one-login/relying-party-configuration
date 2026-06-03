import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import { ClientService } from "../services/client-service";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { Client } from "../models/client";
import { generateApiGatewayResponse, generateErrorResponse } from "./utils";
import { logger } from "../logger";

const clientService = new ClientService(
  DynamoDBDocument.from(new DynamoDBClient({})),
);
export const handler: Handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  if ("PUT" !== event.httpMethod) {
    return generateErrorResponse(405, "Method not allowed");
  }
  const clientId = event.pathParameters?.id;
  if (!clientId) {
    return generateErrorResponse(400, "Client ID path parameter not found");
  }
  if (!event.body) {
    return generateErrorResponse(400, "Client not provided in body of request");
  }
  try {
    // TODO: Perform validation on client input
    const clientInput = JSON.parse(event.body) as unknown as Client;
    const client = await clientService.updateClient(clientInput);
    return generateApiGatewayResponse(200, { ...client });
  } catch (error) {
    logger.error((error as Error).message);
    return generateErrorResponse(500, "Internal server error");
  }
};
