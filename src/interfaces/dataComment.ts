export interface Comment {
    _id: string;
    post_id: string;
    user_id: string;
    content: string;
    level: number;
    parent_comment_id?: string;
    reply_to_user_id?: string;
    like_count: number;
    createdAt: Date;
    updatedAt: Date;
}


export interface CommentPayload extends Comment { }

export interface DeleteCommentPayload {
    _id: string;
    post_id: string;
}

export interface UpdateCommentPayload {
    _id: string;
    content: string;
    post_id: string;
    user_id: string;
}