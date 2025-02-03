import { CognitoIdentityServiceProvider } from "aws-sdk";

import { SignUpDTO } from "../dto";
import { UserType } from "../utils";

const cognito = new CognitoIdentityServiceProvider();

export class UserRepository {
  async registerUser(dto: SignUpDTO): Promise<void> {
    const { email, password, name, phone, rg, userType, cnh, address } = dto;

    const params = {
      UserPoolId: process.env.USER_POOL_ID!,
      Username: email,
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "name", Value: name },
        { Name: "phone_number", Value: phone },
        // Atributos customizados COM prefixo
        { Name: "custom:rg", Value: rg },
        { Name: "custom:user_type", Value: userType }, // ← Corrigido aqui
        ...(userType === UserType.BUYER
          ? [
              { Name: "custom:cnh", Value: cnh },
              { Name: "address", Value: address },
            ]
          : []),
      ],
      TemporaryPassword: password,
    };

    await cognito.adminCreateUser(params).promise();
    await cognito
      .adminAddUserToGroup({
        UserPoolId: process.env.USER_POOL_ID!,
        Username: email,
        GroupName: userType,
      })
      .promise();
  }
}
