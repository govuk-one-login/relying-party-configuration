import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import { generateApiGatewayResponse, generateErrorResponse } from "./utils";
import { logger } from "../logger";
import { getClient } from "../services/client-service";

export const handler: Handler<
  APIGatewayProxyEvent,
  APIGatewayProxyResult
> = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if ("GET" !== event.httpMethod) {
    return generateErrorResponse(405, "Method not allowed");
  }
  try {
    const clientId = event.pathParameters?.id;
    if (!clientId) {
      return generateErrorResponse(400, "Client ID path parameter not found");
    }

    const client = await getClient(clientId);
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
