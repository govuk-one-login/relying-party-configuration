import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import { ClientService } from "./services/client-service";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

export const handler: Handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  if ("GET" === event.httpMethod) {
    try {
      const clientId = event.pathParameters?.id;
      if (!clientId) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            message: "Path parameter not found",
          }),
        };
      }
      const clientService = new ClientService(
        DynamoDBDocument.from(new DynamoDBClient({})),
      );
      const client = await clientService.getClient(clientId);
      if (!client) {
        return {
          statusCode: 404,
          body: JSON.stringify({
            message: `Client not found`,
          }),
        };
      } else {
        return {
          statusCode: 200,
          body: JSON.stringify(client),
        };
      }
    } catch (error) {
      console.log((error as Error).message);
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "Internal server error",
        }),
      };
    }
  } else {
    return {
      statusCode: 405,
      body: JSON.stringify({
        message: "Method not allowed",
      }),
    };
  }
};
