import { messageValueType } from "../configs/kafka";
import { Target_type } from "../constants/voteEnum";
import { VoteDataMessage } from "../interfaces/dataVoteLike";

type BulkOps = {
    postBulkOperations: any[];
    voteBulkOperations: any[];
    commentBulkOperations: any[];
};

export const handleVoteEvent = (
    bulkOps: BulkOps,
    messageValue: messageValueType<VoteDataMessage>
) => {
    const { postBulkOperations, voteBulkOperations, commentBulkOperations } = bulkOps;
    const { target_id, target_type } = messageValue.data;

    target_type === Target_type.POST ?
        postBulkOperations.push({
            updateOne: {
                filter: { _id: target_id },
                update: { $inc: { like_count: 1 } },
            },
        })
        : commentBulkOperations.push({
            updateOne: {
                filter: { _id: target_id },
                update: { $inc: { like_count: 1 } },
            },
        });

    voteBulkOperations.push({
        insertOne: { document: messageValue.data },
    });

};

export const handleUnvoteEvent = (
    bulkOps: BulkOps,
    messageValue: messageValueType<VoteDataMessage>
) => {
    const { postBulkOperations, voteBulkOperations, commentBulkOperations } = bulkOps;
    const { target_id, target_type, _id } = messageValue.data;

    target_type === Target_type.POST ?
        postBulkOperations.push({
            updateOne: {
                filter: { _id: target_id },
                update: { $inc: { like_count: -1 } },
            },
        })
        : commentBulkOperations.push({
            updateOne: {
                filter: { _id: target_id },
                update: { $inc: { like_count: -1 } },
            },
        });

    voteBulkOperations.push({
        deleteOne: {
            filter: { _id }
        },
    });
};
