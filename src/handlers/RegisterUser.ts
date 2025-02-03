import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import { SignUpDTO } from "../dto";
import { validateDto } from "../utils";
import { UserRepository } from "../repositories";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (!event.body) {
    return { statusCode: 400, body: "Request body is missing" };
  }

  const dto = await validateDto(SignUpDTO, JSON.parse(event.body));
  const repository = new UserRepository();

  try {
    await repository.registerUser(dto);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "User registered successfully" }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "User registration failed" }),
    };
  }
};
