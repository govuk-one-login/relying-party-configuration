import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import { ClientService } from "../services/client-service";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { ClientInput } from "../models/client";
import { generateApiGatewayResponse, generateErrorResponse } from "./utils";
import { logger } from "../logger";

const clientService = new ClientService(
  DynamoDBDocument.from(new DynamoDBClient({})),
);
export const handler: Handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  if ("POST" !== event.httpMethod) {
    return generateErrorResponse(405, "Method not allowed");
  }
  if (!event.body) {
    return generateErrorResponse(
      400,
      "Client input not provided in body of request",
    );
  }
  try {
    // TODO: Perform validation on client input
    const clientInput = JSON.parse(event.body) as unknown as ClientInput;
    const client = await clientService.createClient(clientInput);
    return generateApiGatewayResponse(201, { ...client });
  } catch (error) {
    logger.error((error as Error).message);
    return generateErrorResponse(500, "Internal server error");
  }
};
