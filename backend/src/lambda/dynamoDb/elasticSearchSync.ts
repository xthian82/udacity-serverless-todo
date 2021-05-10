import * as elasticsearch from 'elasticsearch'
import * as httpAwsEs from 'http-aws-es'
import {DynamoDBStreamEvent, DynamoDBStreamHandler} from "aws-lambda";
import {createLogger} from "../../utils/logger";

const esHost = process.env.ES_ENDPOINT

const es = new elasticsearch.Client({
    hosts: [ esHost ],
    connectionClass: httpAwsEs
})

const logger = createLogger('elastic')

export const handler: DynamoDBStreamHandler = async (event: DynamoDBStreamEvent) => {
    logger.log("Processing batch event from dynamodb", JSON.stringify(event))
    for (const record of event.Records) {
        logger.log('Processing record ', JSON.stringify(record))

        if (record.eventName !== 'INSERT') {
            continue
        }

        const newItem = record.dynamodb.NewImage

        const imageId = newItem.imageId.S

        const body = {
            imageId: newItem.imageId.S,
            groupId: newItem.todoId.S,
            imageUrl: newItem.imageUrl.S,
            title: newItem.title.S,
            timestamp: newItem.timestamp.S
        }

        await es.index({
            index: 'images-index',
            type: 'images',
            id: imageId,
            body
        })
    }
}
