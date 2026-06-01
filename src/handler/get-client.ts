import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import { ClientService } from "../services/client-service";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { generateApiGatewayResponse, generateErrorResponse } from "./utils";
import { logger } from "../logger";

const clientService = new ClientService(
  DynamoDBDocument.from(
    new DynamoDBClient({
      region: "eu-west-2",
      ...(process.env.DYNAMO_ENDPOINT && {
        endpoint: process.env.DYNAMO_ENDPOINT,
      }),
    }),
  ),
);

export const handler: Handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  if ("GET" !== event.httpMethod) {
    return generateErrorResponse(405, "Method not allowed");
  }
  try {
    const clientId = event.pathParameters?.id;
    if (!clientId) {
      return generateErrorResponse(400, "Client ID path parameter not found");
    }

    const client = await clientService.getClient(clientId);
    if (!client) {
      return generateErrorResponse(404, "Client not found");
    } else {
      return generateApiGatewayResponse(200, { ...client });
    }
  } catch (error) {
    logger.error((error as Error).message);
    return generateErrorResponse(500, "Internal server error");
  }
};
