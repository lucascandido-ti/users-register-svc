import {
  CognitoIdentityProviderClient,
  GetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({
  region: process.env.REGION,
});

export const handler = async (event: {
  headers: { Authorization: string };
}) => {
  const token = event.headers.Authorization?.split(" ")[1];

  if (!token) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "No token provided" }),
    };
  }

  try {
    await client.send(new GetUserCommand({ AccessToken: token }));
    return {
      statusCode: 200,
      body: JSON.stringify({ valid: true }),
    };
  } catch (error) {
    console.error("Token verification error:", error);
    return {
      statusCode: 401,
      body: JSON.stringify({ valid: false, message: "Invalid token" }),
    };
  }
};
