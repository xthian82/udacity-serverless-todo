import { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as AWS  from 'aws-sdk'
import {createLogger} from "../../utils/logger";

const logger = createLogger('conn')

const docClient = new AWS.DynamoDB.DocumentClient()

const connectionsTable = process.env.CONNECTIONS_TABLE

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.log('Websocket connect', JSON.stringify(event))

  const connectionId = event.requestContext.connectionId
  const timestamp = new Date().toISOString()

  const item = {
    id: connectionId,
    timestamp
  }

  logger.log('Storing item: ', JSON.stringify(item))

  await docClient.put({
    TableName: connectionsTable,
    Item: item
  }).promise()

  return {
    statusCode: 200,
    body: ''
  }
}
