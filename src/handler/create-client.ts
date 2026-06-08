import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import { ClientService } from "../services/client-service";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { ClientInput, createClient } from "../models/client";
import { generateApiGatewayResponse, generateErrorResponse } from "./utils";
import { logger } from "../logger";
import { allValidators } from "../helpers/client-validator";

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
    // TODO: Fix IdTokenSigningAlgorithm of RSA256
    const clientInput = JSON.parse(event.body) as unknown as ClientInput;
    const clientToCreate = createClient(clientInput);

    const result = await allValidators.validate(clientToCreate);
    if (!result.isValid) {
      return generateApiGatewayResponse(400, {
        message: "One or more validation errors were found",
        errors: result.reasons,
      });
    }

    const client = await clientService.putClient(clientToCreate);
    return generateApiGatewayResponse(201, { ...client });
  } catch (error) {
    logger.error((error as Error).message);
    return generateErrorResponse(500, "Internal server error");
  }
};
