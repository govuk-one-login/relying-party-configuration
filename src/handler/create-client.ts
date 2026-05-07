import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import { ClientService } from "../services/client-service";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { ClientInput } from "../models/client";

const clientService = new ClientService(
  DynamoDBDocument.from(new DynamoDBClient({})),
);
export const handler: Handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  if ("POST" !== event.httpMethod) {
    return {
      statusCode: 405,
      body: JSON.stringify({
        message: "Method not allowed",
      }),
    };
  }
  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Client input not provided in body of request",
      }),
    };
  }
  try {
    // TODO: Perform validation on client input
    const clientInput = JSON.parse(event.body) as unknown as ClientInput;
    const client = await clientService.createClient(clientInput);
    return {
      statusCode: 201,
      body: JSON.stringify(client),
    };
  } catch (error) {
    console.log((error as Error).message);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error",
      }),
    };
  }
};
