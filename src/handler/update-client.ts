import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import { Client } from "../models/client";
import { generateApiGatewayResponse, generateErrorResponse } from "./utils";
import { logger } from "../logger";
import { allValidators } from "../helpers/client-validator";
import { updateClient } from "../services/client-service";

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
    const clientToUpdate = JSON.parse(event.body) as unknown as Client;

    const result = await allValidators.validate(clientToUpdate);
    if (!result.isValid) {
      return generateApiGatewayResponse(400, {
        message: "One or more validation errors were found",
        errors: result.reasons,
      });
    }

    const client = await updateClient(clientToUpdate);
    return generateApiGatewayResponse(200, { ...client });
  } catch (error) {
    logger.error((error as Error).message);
    return generateErrorResponse(500, "Internal server error");
  }
};
