import { Schema } from "mongoose";

export interface UserTag {
    id: Schema.Types.ObjectId;
    name: string;
}

export interface PollOption {
    content: string;
    vote_count: number;
    voters: Schema.Types.ObjectId[];
    _id: string;
}

export interface Poll {
    end_at: Date;
    status_poll: string;
    poll_options: PollOption[];
}

export interface Urls {
    key: string;
    url: string;
}

// RESPONSES POST
export interface PostDTO {
    type: string;
    _id: Schema.Types.ObjectId;
    creator_id: Schema.Types.ObjectId;
    content: string;
    visibility: string;
    like_count: number;
    comment_count: number;
    qoute_post_count: number;
    urls: Urls[];
    user_tags: UserTag[];
    hashtags: string[];
    createdAt: Date;
}
export interface PollVoteDTO {
    poll_option_id: Schema.Types.ObjectId;
    user_id: Schema.Types.ObjectId;
    post_id: Schema.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

// PAYLOADS POST KAFKA
export interface PostPayloadDTO extends PostDTO {
    poll?: Poll;
    quoted_post_id?: Schema.Types.ObjectId;
    hashtagUpdate: { name: string; type: string; id?: string }[];
}

export interface VotePollPayloadDTO {
    _id: Schema.Types.ObjectId;
    poll: Poll;
    dataPollVote: PollVoteDTO;
}

export interface DeletePostPayloadDTO {
    _id: Schema.Types.ObjectId;
    hashtagUpdate: { name: string; type: string; id?: string }[];
}