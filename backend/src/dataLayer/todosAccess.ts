import { DocumentClient } from 'aws-sdk/clients/dynamodb'

const AWS = require('aws-sdk')

import {TodoItem} from "../models/TodoItem";
import {TodoUpdate} from "../models/TodoUpdate";
import {createLogger} from "../utils/logger";

const todosIndexName = process.env.TODOS_INDEX_NAME

const logger = createLogger('todosLayer')

export class TodosAccess {

  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly todosTable = process.env.TODOS_TABLE) {
  }

  async getTodos(userId: string): Promise<TodoItem[]> {
    logger.info('Getting all todos of user ', userId)

    const result = await this.docClient.query({
      TableName: this.todosTable,
      IndexName: todosIndexName,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }).promise()

    const items = result.Items
    return items as TodoItem[]
  }

  async getTodo(userId, todoId: string): Promise<TodoItem> {
    logger.info('Getting todo of user ', todoId)

    const result = await this.docClient.get({
      TableName: this.todosTable,
      Key: {
        userId: userId,
        todoId: todoId
      }
    }).promise()

    return result.Item as TodoItem
  }

  async createTodo(todoItem: TodoItem): Promise<TodoItem> {
    logger.info('Creating item ', JSON.stringify(todoItem))
    await this.docClient.put({
      TableName: this.todosTable,
      Item: todoItem
    }).promise()

    return todoItem
  }

  async updateTodo(todoItem: TodoItem): Promise<TodoUpdate> {
    logger.info('updating item ', JSON.stringify(todoItem))
    await this.docClient.put({
      TableName: this.todosTable,
      Item: todoItem
    }).promise()

    return todoItem
  }

  async deleteTodo(userId: string, todoId: string): Promise<void> {
    logger.info('deleting item with Id ', todoId)
    await this.docClient.delete({
      TableName: this.todosTable,
      Key: {
        userId: userId,
        todoId: todoId
      }
    }).promise()

  }
}

function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    logger.info('Creating a local DynamoDB instance')
    return new AWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }

  return new AWS.DynamoDB.DocumentClient()
}
