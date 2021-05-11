import * as uuid from 'uuid'

import {CreateTodoRequest} from "../requests/CreateTodoRequest";
import {TodosAccess} from "../dataLayer/todosAccess";
import {TodoItem} from "../models/TodoItem";
import {UpdateTodoRequest} from "../requests/UpdateTodoRequest";
import {TodoUpdate} from "../models/TodoUpdate";
import {ImagesAccess} from "../dataLayer/imagesAccess";

const todosAccess = new TodosAccess()
const imagesAccess = new ImagesAccess()

export async function getTodos(userId: string): Promise<TodoItem[]> {
  return todosAccess.getTodos(userId)
}

export async function createTodo(createTodoRequest: CreateTodoRequest,
                                 userId: string): Promise<TodoItem> {

  const todoId = uuid.v4()

  const todoItem = await todosAccess.createTodo({
    userId,
    todoId,
    createdAt: new Date().toISOString(),
    name: createTodoRequest.name,
    dueDate: createTodoRequest.dueDate,
    done: false
    // attachmentUrl??
  })

  return todoItem
}

export async function getTodoForUser(todoId: string,
                                     userId: string): Promise<TodoItem> {

  const todoItem = await todosAccess.getTodo(userId, todoId)

  if (todoItem.userId !== userId) {
    throw new Error("todo item doesn't belong to user")
  }

  return todoItem
}

export async function updateTodo(updateTodoRequest: UpdateTodoRequest,
                                 todoId: string,
                                 userId: string): Promise<TodoUpdate> {

  const todoItem = await getTodoForUser(todoId, userId)

  todoItem.name = updateTodoRequest.name
  todoItem.dueDate = updateTodoRequest.dueDate
  todoItem.done = updateTodoRequest.done

  const item = await todosAccess.updateTodo(todoItem)

  return item
}

export async function deleteTodo(todoId: string,
                                 userId: string): Promise<void> {

  const todoItem = await getTodoForUser(todoId, userId)

  await todosAccess.deleteTodo(userId, todoItem.todoId)
}

export async function generateUrlImage(userId: string, todoId: string): Promise<TodoItem> {

  const todoItem = await getTodoForUser(todoId, userId)

  const imageId = uuid.v4()
  imagesAccess.generateSignedUploadUrl(imageId)
  todoItem.attachmentUrl = imagesAccess.getUploadUrl(imageId)

  await todosAccess.updateTodo(todoItem)

  return todoItem
}
