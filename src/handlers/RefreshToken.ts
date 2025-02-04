import { RefreshTokenDTO } from "../dto";
import { validateDto } from "../utils";
import { UserRepository } from "../repositories";

export const handler = async (event: { body: string }) => {
  if (!event.body) {
    return { statusCode: 400, body: "Request body is missing" };
  }

  const dto = await validateDto(RefreshTokenDTO, JSON.parse(event.body));
  const repository = new UserRepository();

  try {
    const result = await repository.refreshToken(dto);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error("Refresh token error:", error);
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Invalid refresh token" }),
    };
  }
};
