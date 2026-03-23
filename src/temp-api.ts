import { APIGatewayProxyResult, Handler } from "aws-lambda";

export const handler: Handler = async (): Promise<APIGatewayProxyResult> => {
  return Promise.resolve({
    statusCode: 200,
    body: JSON.stringify({
      message: "Hello World",
    }),
  });
};
