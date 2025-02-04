import { CognitoIdentityServiceProvider } from "aws-sdk";

import { SignInDTO, RegisterUserDTO, RefreshTokenDTO } from "../dto";
import { ISignInResponse, UserType } from "../utils";
import { AdminSetUserPasswordRequest } from "aws-sdk/clients/cognitoidentityserviceprovider";
import {
  AuthFlowType,
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  InitiateAuthCommandInput,
} from "@aws-sdk/client-cognito-identity-provider";

const cognito = new CognitoIdentityServiceProvider();
const client = new CognitoIdentityProviderClient({
  region: process.env.REGION,
});

export class UserRepository {
  async registerUser(dto: RegisterUserDTO): Promise<void> {
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

    const setPasswordParams = {
      UserPoolId: process.env.USER_POOL_ID!,
      Username: email,
      Password: password,
      Permanent: true,
    } as AdminSetUserPasswordRequest;

    await cognito.adminSetUserPassword(setPasswordParams).promise();
    await cognito
      .adminAddUserToGroup({
        UserPoolId: process.env.USER_POOL_ID!,
        Username: email,
        GroupName: userType,
      })
      .promise();
  }

  async signIn(dto: SignInDTO): Promise<ISignInResponse> {
    const { username, password } = dto;

    const params = {
      AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
      ClientId: process.env.COGNITO_CLIENT_ID,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      },
    } as InitiateAuthCommandInput;

    const response = await client.send(new InitiateAuthCommand(params));

    return {
      accessToken: response.AuthenticationResult?.AccessToken,
      refreshToken: response.AuthenticationResult?.RefreshToken,
      tokenId: response.AuthenticationResult?.IdToken,
    };
  }

  async refreshToken(
    dto: RefreshTokenDTO
  ): Promise<Pick<ISignInResponse, "accessToken" | "tokenId">> {
    const { refreshToken } = dto;

    const params = {
      AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
      ClientId: process.env.COGNITO_CLIENT_ID,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
      },
    } as InitiateAuthCommandInput;

    const response = await client.send(new InitiateAuthCommand(params));

    return {
      accessToken: response.AuthenticationResult?.AccessToken,
      tokenId: response.AuthenticationResult?.IdToken,
    };
  }
}
