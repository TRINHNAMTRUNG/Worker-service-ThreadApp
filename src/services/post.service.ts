import { messageValueType } from "../configs/kafka";
import { PostPayloadDTO, VotePollPayloadDTO, DeletePostPayloadDTO } from "../interfaces/dataPost";

const findOrCreateHashtags = (hashtagUpdates: { name: string, type: string, id?: string }[] = []) => {
    if (!Array.isArray(hashtagUpdates)) return [];
    return hashtagUpdates.map(update => ({
        updateOne: {
            filter: { name: update.name },
            update: {
                $inc: { post_count: update.type === "add" ? 1 : -1 },
                $setOnInsert: { _id: update.id, name: update.name },
            },
            upsert: true
        }
    }));
};

type BulkOps = {
    postBulkOperations: any[];
    hashtagBulkOperations: any[];
    pollVoteBulkOperations: any[];
};

// Tạo post mới
export const handlePostCreatedEvent = (
    bulkOps: BulkOps,
    messageValue: messageValueType<PostPayloadDTO>
) => {
    const { postBulkOperations, hashtagBulkOperations } = bulkOps;
    const { hashtagUpdate, ...data } = messageValue.data;
    postBulkOperations.push({
        insertOne: { document: data }
    });
    hashtagBulkOperations.push(...findOrCreateHashtags(hashtagUpdate));
};

// Cập nhật post
export const handlePostUpdatedEvent = (
    bulkOps: BulkOps,
    messageValue: messageValueType<PostPayloadDTO>
) => {
    const { postBulkOperations, hashtagBulkOperations } = bulkOps;
    const { hashtagUpdate, _id, ...updateData } = messageValue.data;
    postBulkOperations.push({
        updateOne: {
            filter: { _id },
            update: { $set: updateData }
        }
    });
    hashtagBulkOperations.push(...findOrCreateHashtags(hashtagUpdate));
};

// Khi vote poll (POST_POLL_VOTED)
export const handlePostPollVotedEvent = (
    bulkOps: BulkOps,
    messageValue: messageValueType<VotePollPayloadDTO>
) => {
    const { postBulkOperations, pollVoteBulkOperations } = bulkOps;
    const { _id, poll, dataPollVote } = messageValue.data;

    // Cập nhật poll trong post
    postBulkOperations.push({
        updateOne: {
            filter: { _id },
            update: { $set: { poll } }
        }
    });

    // Lưu poll vote
    if (dataPollVote) {
        pollVoteBulkOperations.push({
            insertOne: { document: dataPollVote }
        });
    }
};

// Xóa post
export const handlePostDeletedEvent = (
    bulkOps: BulkOps,
    messageValue: messageValueType<DeletePostPayloadDTO>
) => {
    const { postBulkOperations, hashtagBulkOperations } = bulkOps;
    const { _id, hashtagUpdate } = messageValue.data;
    postBulkOperations.push({
        deleteOne: {
            filter: { _id }
        }
    });
    hashtagBulkOperations.push(...findOrCreateHashtags(hashtagUpdate));
};