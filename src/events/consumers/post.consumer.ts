import { kafkaConsumer, messageValueType } from "../../configs/kafka";
import { EventTypes } from "../../constants/eventTypes";
import HashtagModel from "../../models/hashtagModel";
import PostModel from "../../models/postModel";
import PollVoteModel from "../../models/pollVoteModel";
import { Batch } from "kafkajs";
import {
    handlePostCreatedEvent,
    handlePostDeletedEvent,
    handlePostPollVotedEvent,
    handlePostUpdatedEvent
} from "../../services/post.service";

type BulkOps = {
    postBulkOperations: any[];
    hashtagBulkOperations: any[];
    pollVoteBulkOperations: any[];
};

export const handlePostTopic = async (
    batch: Batch,
    resolveOffset: (offset: string) => void,
    commitOffsetsIfNecessary: () => Promise<void>
) => {
    const bulkPayloads: BulkOps = {
        postBulkOperations: [],
        hashtagBulkOperations: [],
        pollVoteBulkOperations: [],
    };
    const startTime = Date.now();

    for (const message of batch.messages) {
        const messageValue = JSON.parse(message.value?.toString() || "{}");
        const { eventType } = messageValue;

        switch (eventType) {
            case EventTypes.POST_CREATED:
                handlePostCreatedEvent(bulkPayloads, messageValue);
                console.log(`Post created event received at offset ${message.offset}:`, messageValue);
                break;
            case EventTypes.POST_UPDATED:
                handlePostUpdatedEvent(bulkPayloads, messageValue);
                console.log(`Post updated event received at offset ${message.offset}:`, messageValue);
                break;
            case EventTypes.POST_DELETED:
                handlePostDeletedEvent(bulkPayloads, messageValue);
                console.log(`Post deleted event received at offset ${message.offset}:`, messageValue);
                break;
            case EventTypes.POST_POLL_VOTED:
                handlePostPollVotedEvent(bulkPayloads, messageValue);
                console.log(`Post Poll Voted event received at offset ${message.offset}:`, messageValue);
                break;
            default:
                console.log(`Unknown event type at offset ${message.offset}:`, eventType);
                break;
        }
    }

    try {
        // Bulk write cho Post
        if (bulkPayloads.postBulkOperations.length > 0) {
            await PostModel.bulkWrite(bulkPayloads.postBulkOperations, { ordered: true });
        }
        // Bulk write cho Hashtag
        if (bulkPayloads.hashtagBulkOperations.length > 0) {
            await HashtagModel.bulkWrite(bulkPayloads.hashtagBulkOperations, { ordered: true });
        }
        // Bulk write cho PollVote (nếu có)
        if (bulkPayloads.pollVoteBulkOperations.length > 0) {
            await PollVoteModel.bulkWrite(bulkPayloads.pollVoteBulkOperations, { ordered: true });
        }
        console.log(
            `Bulk write successful: ${bulkPayloads.postBulkOperations.length} posts, ${bulkPayloads.hashtagBulkOperations.length} hashtags, ${bulkPayloads.pollVoteBulkOperations.length} pollVotes in ${Date.now() - startTime}ms`
        );
    } catch (error) {
        console.error(
            `Error during bulkWrite for topic ${batch.topic}, partition ${batch.partition}, pausing consumer:`,
            error
        );
        await kafkaConsumer.pause([{ topic: batch.topic, partitions: [batch.partition] }]);
        throw error;
    }

    // Commit offset cho tất cả message
    for (const message of batch.messages) {
        resolveOffset(message.offset);
    }
    await commitOffsetsIfNecessary();
};