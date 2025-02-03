import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";

export async function validateDto<T extends object>(
  dtoClass: new () => T,
  payload: any
): Promise<T> {
  const dtoInstance = plainToInstance(dtoClass, payload);
  const errors = await validate(dtoInstance);

  if (errors.length > 0) {
    throw new Error(
      `Validation failed: ${errors
        .map((err) => Object.values(err.constraints || {}).join(", "))
        .join("; ")}`
    );
  }

  return dtoInstance;
}
