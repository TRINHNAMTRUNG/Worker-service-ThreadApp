import { kafkaConsumer, messageValueType } from "../../configs/kafka";
import { EventTypes } from "../../constants/eventTypes";
import CommentModel from "../../models/commentModel";
import CommentEditHistoryModel from "../../models/CommentEditHistoryModel";
import PostModel from "../../models/postModel";
import { Batch } from "kafkajs";
import {
    handleCommentCreatedEvent,
    handleCommentUpdatedEvent,
    handleCommentDeletedEvent
} from "../../services/comment.service";

type BulkOps = {
    commentBulkOperations: any[];
    postBulkOperations: any[];
    commentEditHistoryBulkOperations: any[];
};

export const handleCommentTopic = async (
    batch: Batch,
    resolveOffset: (offset: string) => void,
    commitOffsetsIfNecessary: () => Promise<void>
) => {
    const bulkPayloads: BulkOps = {
        commentBulkOperations: [],
        postBulkOperations: [],
        commentEditHistoryBulkOperations: []
    };
    const startTime = Date.now();

    for (const message of batch.messages) {
        const messageValue = JSON.parse(message.value?.toString() || "{}");
        const { eventType } = messageValue;

        switch (eventType) {
            case EventTypes.COMMENT_CREATED:
                handleCommentCreatedEvent(bulkPayloads, messageValue);
                console.log(`Comment created event received at offset ${message.offset}:`, messageValue);
                break;
            case EventTypes.COMMENT_UPDATED:
                handleCommentUpdatedEvent(bulkPayloads, messageValue);
                console.log(`Comment updated event received at offset ${message.offset}:`, messageValue);
                break;
            case EventTypes.COMMENT_DELETED:
                handleCommentDeletedEvent(bulkPayloads, messageValue);
                console.log(`Comment deleted event received at offset ${message.offset}:`, messageValue);
                break;
            default:
                console.log(`Unknown event type at offset ${message.offset}:`, eventType);
                break;
        }
    }

    // Thực hiện bulkWrite cho comment
    try {
        if (bulkPayloads.commentBulkOperations.length > 0) {
            await CommentModel.bulkWrite(bulkPayloads.commentBulkOperations, { ordered: true });
        }
        if (bulkPayloads.postBulkOperations.length > 0) {
            await PostModel.bulkWrite(bulkPayloads.postBulkOperations, { ordered: true });
        }
        if (bulkPayloads.commentEditHistoryBulkOperations.length > 0) {
            await CommentEditHistoryModel.bulkWrite(bulkPayloads.commentEditHistoryBulkOperations, { ordered: true });
        }
        console.log(
            `Bulk write successful for ${bulkPayloads.commentBulkOperations.length} comments, ${bulkPayloads.postBulkOperations.length} posts, ${bulkPayloads.commentEditHistoryBulkOperations.length} comment edit histories in ${Date.now() - startTime}ms`
        );
    } catch (error) {
        console.error(
            `Error during bulkWrite for topic ${batch.topic}, partition ${batch.partition}, pausing consumer:`,
            error
        );
        await kafkaConsumer.pause([{ topic: batch.topic, partitions: [batch.partition] }]);
        throw error;
    }

    for (const message of batch.messages) {
        resolveOffset(message.offset);
    }
    await commitOffsetsIfNecessary();
};