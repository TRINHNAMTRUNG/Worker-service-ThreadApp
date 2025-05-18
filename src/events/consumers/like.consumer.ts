import { kafkaConsumer, messageValueType } from "../../configs/kafka";
import { EventTypes } from "../../constants/eventTypes";
import PostModel from "../../models/postModel";
import VoteModel from "../../models/voteModel";
import { Batch } from "kafkajs";
import {
    handleUnvoteEvent,
    handleVoteEvent
} from "../../services/voteLike.service";
import { VoteDataMessage } from "../../interfaces/dataVoteLike";
import CommentModel from "../../models/commentModel";

type BulkOps = {
    postBulkOperations: any[];
    commentBulkOperations: any[];
    voteBulkOperations: any[];
};

export const handleVoteLikeTopic = async (
    batch: Batch,
    resolveOffset: (offset: string) => void,
    commitOffsetsIfNecessary: () => Promise<void>
) => {
    const bulkPayloads: BulkOps = {
        postBulkOperations: [],
        commentBulkOperations: [],
        voteBulkOperations: []
    };

    const startTime = Date.now();

    for (const message of batch.messages) {
        const messageValue = JSON.parse(message.value?.toString() || "{}") as messageValueType<VoteDataMessage>;
        const { eventType } = messageValue;

        switch (eventType) {
            case EventTypes.LIKE_VOTED: {
                handleVoteEvent(bulkPayloads, messageValue);
                console.log(`Vote event (LIKE_VOTED) received at offset ${message.offset}:`, messageValue);
                break;
            }
            case EventTypes.LIKE_UNVOTED: {
                handleUnvoteEvent(bulkPayloads, messageValue);
                console.log(`Vote event (LIKE_UNVOTED) received at offset ${message.offset}:`, messageValue);
                break;
            }
            default:
                console.log(`Unknown event type at offset ${message.offset}:`, eventType);
                break;
        }
    }

    // Thực hiện bulk write nếu có thao tác
    try {
        if (bulkPayloads.postBulkOperations.length > 0) {
            await PostModel.bulkWrite(bulkPayloads.postBulkOperations, { ordered: true });
        }

        if (bulkPayloads.commentBulkOperations.length > 0) {
            await CommentModel.bulkWrite(bulkPayloads.commentBulkOperations, { ordered: true });
        }

        if (bulkPayloads.voteBulkOperations.length > 0) {
            await VoteModel.bulkWrite(bulkPayloads.voteBulkOperations, { ordered: true });
        }

        console.log(
            `Bulk write done: ${bulkPayloads.postBulkOperations.length} posts, ${bulkPayloads.voteBulkOperations.length} votes in ${Date.now() - startTime}ms`
        );
    } catch (error) {
        console.error(
            `Error during bulkWrite for topic ${batch.topic}, partition ${batch.partition}, pausing consumer:`,
            error
        );
        await kafkaConsumer.pause([{ topic: batch.topic, partitions: [batch.partition] }]);
        throw error; // Optional: send to DLQ (dead letter queue)
    }

    // Commit offsets
    for (const message of batch.messages) {
        resolveOffset(message.offset);
    }

    await commitOffsetsIfNecessary();
};
