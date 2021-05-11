import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import {createLogger} from "../../utils/logger";
import {updateTodo} from "../../businessLogic/todos";
import {getUserId} from "../utils";

const logger = createLogger('updateTodoFunc')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)
  const userId = getUserId(event)

  logger.info('update todo ', JSON.stringify(updatedTodo), ' for id ', todoId, ' for user ', userId)
  const updatedItem = await updateTodo(updatedTodo, todoId, userId)

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      ...updatedItem
    })
  }
}
