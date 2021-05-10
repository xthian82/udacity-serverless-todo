import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify, decode,  } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import { JwkRsa } from '../../models/JwkRsa'
import Axios, {AxiosResponse} from 'axios'
import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')

const jwksUrl = 'https://dev-n52gwsqz.us.auth0.com/.well-known/jwks.json'

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  const jwt: Jwt = decode(token, { complete: true }) as Jwt

  console.log('Retrieving jwks')
  const response: AxiosResponse<[JwkRsa]> = await Axios.get<[JwkRsa]>(jwksUrl)
  const rsaKey: JwkRsa = response.data.find(data => data.kid === jwt.header.kid)

  console.log('verifying jwt')
  return verify(token, cert(rsaKey.x5c[0]), { algorithms: ['RS256']}) as JwtPayload
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  if (split.length != 2) {
    throw new Error('No authorization token was found');
  }
  const token = split[1]

  return token
}

function cert(key: string) {
  //cert = cert.match(/.{1,64}/g).join('\n');
  return `-----BEGIN CERTIFICATE-----\n${key}\n-----END CERTIFICATE-----\n`;
}