import { messageValueType } from "../configs/kafka";
import { CommentPayload, DeleteCommentPayload, UpdateCommentPayload } from "../interfaces/dataComment"
type BulkOps = {
    commentBulkOperations: any[];
    postBulkOperations: any[];
    commentEditHistoryBulkOperations: any[];
};

export const handleCommentCreatedEvent = (
    bulkOps: BulkOps,
    messageValue: messageValueType<CommentPayload>
) => {
    const { commentBulkOperations, postBulkOperations, commentEditHistoryBulkOperations } = bulkOps;
    const data = messageValue.data;

    commentBulkOperations.push({
        insertOne: { document: data }
    });


    if (data.post_id) {
        // Tăng comment_count cho post
        postBulkOperations.push({
            updateOne: {
                filter: { _id: data.post_id },
                update: { $inc: { comment_count: 1 } }
            }
        });
        // Lưu trữ lịch sử chỉnh sửa comment
        commentEditHistoryBulkOperations.push({
            insertOne: {
                document: {
                    comment_id: data._id,
                    post_id: data.post_id,
                    user_id: data.user_id,
                    content: data.content
                }
            }
        });
    }
};

export const handleCommentUpdatedEvent = (
    bulkOps: BulkOps,
    messageValue: messageValueType<UpdateCommentPayload>
) => {
    const { commentBulkOperations, commentEditHistoryBulkOperations } = bulkOps;
    const data = messageValue.data;
    const { _id, ...updateData } = data;

    commentBulkOperations.push({
        updateOne: {
            filter: { _id },
            update: { $set: updateData }
        }
    });
    // Lưu trữ lịch sử chỉnh sửa comment
    commentEditHistoryBulkOperations.push({
        insertOne: {
            document: {
                comment_id: data._id,
                post_id: data.post_id,
                user_id: data.user_id,
                content: data.content
            }
        }
    });
};

export const handleCommentDeletedEvent = (
    bulkOps: BulkOps,
    messageValue: messageValueType<DeleteCommentPayload>
) => {
    const { commentBulkOperations, postBulkOperations, commentEditHistoryBulkOperations } = bulkOps;
    const data = messageValue.data;

    commentBulkOperations.push({
        deleteOne: {
            filter: { _id: data._id }
        }
    });

    // Giảm comment_count cho post
    if (data.post_id) {
        postBulkOperations.push({
            updateOne: {
                filter: { _id: data.post_id },
                update: { $inc: { comment_count: -1 } }
            }
        });
    }

    // Xóa lịch sử chỉnh sửa comment
    commentEditHistoryBulkOperations.push({
        deleteMany: {
            filter: { comment_id: data._id }
        }
    });
};