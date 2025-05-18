import { Schema } from "mongoose";
import { Target_type } from "../constants/voteEnum";


export interface VoteDataMessage {
    _id: Schema.Types.ObjectId,
    target_id: Schema.Types.ObjectId,
    target_type: Target_type,
    user_id: Schema.Types.ObjectId,
    createdAt: Date
}