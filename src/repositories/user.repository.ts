import {
  AdminGetUserCommand,
  AuthFlowType,
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  InitiateAuthCommandInput,
} from "@aws-sdk/client-cognito-identity-provider";
import { CognitoIdentityServiceProvider } from "aws-sdk";
import { APIGatewayProxyEventQueryStringParameters } from "aws-lambda";
import { AdminSetUserPasswordRequest } from "aws-sdk/clients/cognitoidentityserviceprovider";

import { ISignInResponse, UserType } from "../utils";
import { SignInDTO, RegisterUserDTO, RefreshTokenDTO } from "../dto";

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
        { Name: "custom:rg", Value: rg },
        { Name: "custom:user_type", Value: userType },
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

  async getUserData(
    token: string,
    requestParams: APIGatewayProxyEventQueryStringParameters
  ) {
    const params = {
      AccessToken: token,
    };

    const userData = await cognito.getUser(params).promise();

    const isSeller = userData.UserAttributes.find(({ Name, Value }) => {
      if (Name === "cognito:groups") {
        return Value?.includes("seller");
      }
    });

    console.debug("[UserRepository][getUserData]|[isSeller] => ", isSeller);

    let username: string;

    if (isSeller) {
      // Lógica para administradores
      if (!requestParams.email) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            message:
              "Parâmetro userId ou email obrigatório para administradores",
          }),
        };
      }

      username = requestParams.email;
    } else {
      username = String(
        userData.UserAttributes.find(({ Name }) => Name === "username")?.Value
      );
    }

    console.debug("[UserRepository][getUserData]|[username]=> ", username);

    const getUserCommand = new AdminGetUserCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Username: username,
    });

    return await client.send(getUserCommand);
  }
}
