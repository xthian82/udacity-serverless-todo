import { DocumentClient } from 'aws-sdk/clients/dynamodb'

const AWS = require('aws-sdk')

import {TodoItem} from "../models/TodoItem";
import {TodoUpdate} from "../models/TodoUpdate";
import {createLogger} from "../utils/logger";
import {UpdateTodoRequest} from "../requests/UpdateTodoRequest";

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

  async createTodo(todoItem: TodoItem): Promise<TodoItem> {
    logger.info('Creating item ', JSON.stringify(todoItem))
    await this.docClient.put({
      TableName: this.todosTable,
      Item: todoItem
    }).promise()

    return todoItem
  }

  async updateTodo(updateTodoRequest: UpdateTodoRequest,
                   todoId: string,
                   userId: string): Promise<TodoUpdate> {
    logger.info('updating item ', JSON.stringify(updateTodoRequest))

    const todoUpdate: TodoUpdate = {
      name: updateTodoRequest.name,
      dueDate: updateTodoRequest.dueDate,
      done: updateTodoRequest.done
    }

    await this.docClient.update({
        TableName: this.todosTable,
        Key: {
          "userId": userId,
          "todoId": todoId
        },
        UpdateExpression: "SET #ns=:name, #dd=:dueDate, #do=:done",
        ExpressionAttributeValues:{
            ":name": todoUpdate.name,
            ":dueDate": todoUpdate.dueDate,
            ":done": todoUpdate.done,
        },
        ExpressionAttributeNames: {
            "#ns": "name",
            "#dd": "dueDate",
            "#do": "done"
        },

        ReturnValues:"UPDATED_NEW"
      }, (err, _) => {
          if (err) {
            logger.error("Unable to update item. Error JSON:", JSON.stringify(err));
          }
        }
    ).promise()

    return todoUpdate
  }

  async deleteTodo(userId: string, todoId: string): Promise<void> {
    logger.info('deleting item with Id ', todoId)
    await this.docClient.delete({
      TableName: this.todosTable,
      Key: {
        'userId': userId,
        'todoId': todoId
      }
    },(err, _) => {
      if (err) {
        logger.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
      }
    }).promise()

  }

  // TODO: this should be done when an actual image is uploaded to bucket
  async uploadUrlForUser(todoId: string, userId: string, attachmentUrl: string): Promise<string> {
    logger.info('generating url image ', todoId)

    await this.docClient.update({
          TableName: this.todosTable,
          Key: {
            "userId": userId,
            "todoId": todoId
          },
          UpdateExpression: "set attachmentUrl = :attachmentUrl",
          ExpressionAttributeValues:{
            ":attachmentUrl": attachmentUrl
          },
          ReturnValues:"UPDATED_NEW"
        }, (err, _) => {
          if (err) {
            logger.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
          }
        }
    ).promise()

    return "";
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
