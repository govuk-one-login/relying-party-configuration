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
      const pageNumber = Number(event.queryStringParameters?.pageNumber) || 1;
      const pageSize = Number(event.queryStringParameters?.pageSize) || 20;
      const clientService = new ClientService(
        DynamoDBDocument.from(new DynamoDBClient({})),
      );
      const paginatedResponse = await clientService.getClientSummaries(
        pageNumber,
        pageSize,
      );
      return {
        statusCode: 200,
        body: JSON.stringify(paginatedResponse),
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
  } else {
    return {
      statusCode: 405,
      body: JSON.stringify({
        message: "Method not allowed",
      }),
    };
  }
};
