import axios from 'axios';
import type { FileHistory, ChatMessage } from '../types/history';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Get auth token and user ID from localStorage
const getAuthData = () => {
    const sessionData = localStorage.getItem('StudAI-Builder');
    if (!sessionData) {
        throw new Error('No session data found');
    }
    const parsed = JSON.parse(sessionData);
    return {
        headers: { Authorization: `Bearer ${parsed.token}` },
        userId: parsed.user.id
    };
};

export const historyService = {
    // Store generated file
    async storeFile(fileContent: string, fileName: string, fileType: string): Promise<{ fileUrl: string }> {
        try {
            const { headers, userId } = getAuthData();
            console.log('Storing file:', { fileName, fileType, contentLength: fileContent.length });

            const response = await axios.post(
                `${API_URL}/history/file`,
                {
                    fileContent,
                    fileName,
                    fileType,
                    log: userId
                },
                { headers }
            );
            console.log('File stored successfully:', response.data);
            return response.data;
        } catch (error) {
            console.error('Failed to store file:', error);
            throw error;
        }
    },

    // Store chat message
    async storeChatMessage(message: string, role: 'user' | 'assistant'): Promise<void> {
        try {
            const { headers, userId } = getAuthData();
            await axios.post(
                `${API_URL}/history/chat`,
                {
                    message,
                    role,
                    log: userId
                },
                { headers }
            );
        } catch (error) {
            console.error('Failed to store chat message:', error);
            throw error;
        }
    },

    // Get file history
    async getFileHistory(): Promise<FileHistory[]> {
        try {
            const { headers, userId } = getAuthData();
            console.log('Getting file history for user:', userId);

            const response = await axios.post(
                `${API_URL}/history/files`,
                { log: userId },
                { headers }
            );
            console.log('File history response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Failed to fetch file history:', error);
            throw error;
        }
    },

    // Get chat history
    async getChatHistory(): Promise<ChatMessage[]> {
        try {
            const { headers, userId } = getAuthData();
            console.log('Getting chat history for user:', userId);

            const response = await axios.post(
                `${API_URL}/history/chats`,
                { log: userId },
                { headers }
            );
            console.log('Chat history response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Failed to fetch chat history:', error);
            throw error;
        }
    },

    // Delete file
    async deleteFile(fileId: string): Promise<void> {
        try {
            const { headers, userId } = getAuthData();
            console.log('Deleting file:', fileId);

            await axios.post(
                `${API_URL}/history/filed/${fileId}`,
                {
                   
                    userId 
                }
            );
            console.log('File deleted successfully');
        } catch (error) {
            console.error('Failed to delete file:', error);
            throw error;
        }
    }
};
