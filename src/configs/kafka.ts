import { Kafka } from "kafkajs";
import dotenv from "dotenv";
import { TopicTypes } from "../constants/topicTypes";
import { handlePostTopic } from "../events/consumers/post.consumer";
import { EventTypes } from "../constants/eventTypes";
import { handleVoteLikeTopic } from "../events/consumers/like.consumer";
import { handleCommentTopic } from "../events/consumers/comment.consumer";
dotenv.config();

const kafka = new Kafka({
    clientId: process.env.SOURCE as string,
    brokers: ["kafka:9092"]
});

export interface messageValueType<DataMessageType> {
    eventId: string,
    data: DataMessageType,
    eventType: EventTypes,
    topicType: TopicTypes,
    timestamp: string,
    source: string
};

export const kafkaProducer = kafka.producer();
export const kafkaConsumer = kafka.consumer({
    groupId: process.env.SOURCE as string,
    maxWaitTimeInMs: 1000,
    minBytes: 1,
    maxBytes: 1048576, // Tăng lên 1MB (giả định 10 message x 100KB)
    maxBytesPerPartition: 1000000
});

export const producerConnectToKafka = async () => {
    try {
        await kafkaProducer.connect();
        console.log("Kafka producer connected successfully");
    } catch (error) {
        console.error("Error connecting to Kafka producer:", error);
        process.exit(1);
    }
};

export const consumerConnectToKafka = async () => {
    try {
        await kafkaConsumer.connect();
        console.log("Kafka consumer connected successfully");
    } catch (error) {
        throw new Error("Error connecting to Kafka consumer: " + error);
    }
}

export const runConsumer = async () => {
    try {
        const listTopics = Object.values(TopicTypes);
        const subscribedTopics = [];
        for (const topic of listTopics) {
            await kafkaConsumer.subscribe({ topic, fromBeginning: false });
            subscribedTopics.push(topic);
        };
        await kafkaConsumer.run({
            eachBatch: async ({ batch, resolveOffset, heartbeat, commitOffsetsIfNecessary }) => {

                const topic = batch.topic;
                const startTime = Date.now();
                switch (topic) {
                    case TopicTypes.POST_EVENT:
                        handlePostTopic(batch, resolveOffset, commitOffsetsIfNecessary);
                        break;
                    case TopicTypes.COMMENT_EVENT:
                        handleCommentTopic(batch, resolveOffset, commitOffsetsIfNecessary);
                        break;
                    case TopicTypes.LIKE_EVENT:
                        handleVoteLikeTopic(batch, resolveOffset, commitOffsetsIfNecessary);
                        break;
                    default:
                        console.log("Unknown event type:", topic);
                        break;
                }

                console.log(`Processed batch of ${batch.messages.length} messages in ${Date.now() - startTime}ms`);
                if (batch.messages.length > 50 || Date.now() - startTime > 500) {
                    await heartbeat();
                }
            }
        })
    } catch (error) {
        throw new Error("Error running Kafka consumer: " + error);
    }
}
