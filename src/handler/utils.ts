import { APIGatewayProxyResult } from "aws-lambda";
import { logger } from "../logger";

export const generateApiGatewayResponse = (
  statusCode: number,
  response: Record<string, unknown>,
): APIGatewayProxyResult => {
  try {
    return {
      statusCode,
      body: JSON.stringify(response),
    };
  } catch (err) {
    logger.error(`Failed to serialize JSON: ${(err as Error).message}`);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error",
      }),
    };
  }
};

export const generateErrorResponse = (
  statusCode: number,
  message: string,
): APIGatewayProxyResult => {
  return generateApiGatewayResponse(statusCode, {
    message,
  });
};

export const generateServerErrorResponse = (): APIGatewayProxyResult => {
  return generateErrorResponse(500, "Internal server error");
};
