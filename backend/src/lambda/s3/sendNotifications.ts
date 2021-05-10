import {S3Event, SNSEvent, SNSHandler} from "aws-lambda";
import * as AWS  from 'aws-sdk'
import {createLogger} from "../../utils/logger";

const docClient = new AWS.DynamoDB.DocumentClient()
const connectionsTable = process.env.CONNECTIONS_TABLE
const stage = process.env.STAGE
const apiId = process.env.API_ID

const apiGateway = new AWS.ApiGatewayManagementApi({
    apiVersion: "2018-11-29",
    endpoint: `${apiId}.execute-api.us-east-1.amazonaws.com/${stage}`
})

const logger = createLogger('s3not')

export const handler: SNSHandler = async (event: SNSEvent) => {
    logger.log('Processing SNS Event', JSON.stringify(event))

    for (const snsRecord of event.Records) {
        const s3EventStr = snsRecord.Sns.Message
        logger.log("processing s3 event", s3EventStr)
        const s3event = JSON.parse(s3EventStr)

        await processS3Event(s3event)
    }
}

async function processS3Event(event: S3Event) {
    for (const record of event.Records) {
        const key = record.s3.object.key
        logger.log("Processing S3 item with key: ", key)

        const connections = await docClient.scan({
            TableName: connectionsTable
        }).promise()

        const payload = {
            imageId: key
        }

        for (const connection of connections.Items) {
            const connectionId = connection.id
            await sendMessageToClient(connectionId, payload)
        }
    }
}

async function sendMessageToClient(connectionId: string, payload: object) {
    try {
        logger.log('Sending message to a connection', connectionId)
        await apiGateway.postToConnection({
            ConnectionId: connectionId,
            Data: JSON.stringify(payload)
        }).promise()
    } catch (e) {
        logger.log('Failed to send message', JSON.stringify(e))
        if (e.statusCode === 410) {
            logger.log('Stale connection ', connectionId)
            await docClient.delete({
                TableName: connectionsTable,
                Key: {
                    id: connectionId
                }
            }).promise()
        }
    }
}
