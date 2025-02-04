import { SignInDTO } from "../dto";
import { validateDto } from "../utils";
import { UserRepository } from "../repositories";

export const handler = async (event: { body: string }) => {
  if (!event.body) {
    return { statusCode: 400, body: "Request body is missing" };
  }

  const dto = await validateDto(SignInDTO, JSON.parse(event.body));
  const repository = new UserRepository();

  try {
    const result = await repository.signIn(dto);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Invalid credentials" }),
    };
  }
};
