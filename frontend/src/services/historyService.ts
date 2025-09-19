import axios from 'axios';
import type { FileHistory } from '../types/history';
import { buildApiUrl } from '../config/api';

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
            const { headers } = getAuthData();
            // console.log('Storing file:', { fileName, fileType, contentLength: fileContent.length });

            const response = await axios.post(
                buildApiUrl('/api/history/file'),
                {
                    fileContent,
                    fileName,
                    fileType
                },
                { headers }
            );
            // console.log('File stored successfully:', response.data);
            return response.data;
        } catch (error) {
            console.error('Failed to store file:', error);
            throw error;
        }
    },



    // Get file history
    async getFileHistory(): Promise<FileHistory[]> {
        try {
            const { headers } = getAuthData();
            const response = await axios.get(
                buildApiUrl('/api/history/files'),
                { headers }
            );
            // console.log('File history response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Failed to fetch file history:', error);
            throw error;
        }
    },



    // Delete file
    async deleteFile(fileId: string): Promise<void> {
        try {
            const { headers } = getAuthData();
            // console.log('Deleting file:', fileId);

            await axios.delete(
                buildApiUrl(`/api/history/files/${fileId}`),
                { headers }
            );
            // console.log('File deleted successfully');
        } catch (error) {
            // console.error('Failed to delete file:', error);
            throw error;
        }
    }
};
