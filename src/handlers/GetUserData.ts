import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import { UserRepository } from "../repositories";
import { UnauthorizedException } from "../exceptions";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (!event.pathParameters) {
    return { statusCode: 400, body: "Request body is missing" };
  }

  const authHeader = event.headers.Authorization || event.headers.authorization;
  const accessToken = authHeader?.replace("Bearer ", "");
  const requestParams = event.queryStringParameters || {};

  if (!accessToken)
    throw new UnauthorizedException("Not authorized: Without Access Token");

  const repository = new UserRepository();

  try {
    const result = await repository.getUserData(accessToken, requestParams);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(result),
    };
  } catch (error: any) {
    return { statusCode: error.status, body: error.message };
  }
};
