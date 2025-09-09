export interface FileHistory {
    id: string;
    user_id: string;
    file_name: string;
    file_type: string;
    file_path: string;
    public_url: string;
    created_at: string;
}

export interface ChatMessage {
    id: string;
    user_id: string;
    message: string;
    role: 'user' | 'assistant';
    created_at: string;
}
