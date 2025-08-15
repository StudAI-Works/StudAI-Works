import React, { useEffect, useState } from 'react';
import { historyService } from '../services/historyService';
import type { FileHistory, ChatMessage } from '../types/history';
import { Trash2, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const HistoryPanel: React.FC = () => {
    const [files, setFiles] = useState<FileHistory[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [activeTab, setActiveTab] = useState<'files' | 'chat'>('files');
    const [loading, setLoading] = useState(true);
    const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            setLoading(true);
            const [fileHistory, chatHistory] = await Promise.all([
                historyService.getFileHistory(),
                historyService.getChatHistory()
            ]);
            setFiles(fileHistory);
            setMessages(chatHistory);
        } catch (error: any) {
            console.error('Failed to load history:', error);
            if (error.response?.status === 401) {
                toast({
                    title: "Authentication Error",
                    description: "Please log in to view your history.",
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Error",
                    description: "Failed to load history. Please try again later.",
                    variant: "destructive",
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteFile = async (fileId: string) => {
        try {
            setDeleteLoading(fileId);
            await historyService.deleteFile(fileId);
            setFiles(files.filter(file => file.id !== fileId));
            toast({
                title: "File deleted",
                description: "The file has been successfully deleted.",
                variant: "default",
            });
        } catch (error) {
            console.error('Failed to delete file:', error);
            toast({
                title: "Error",
                description: "Failed to delete the file. Please try again.",
                variant: "destructive",
            });
        } finally {
            setDeleteLoading(null);
        }
    };

    const handleRefresh = async () => {
        await loadHistory();
        toast({
            title: "Refreshed",
            description: "Your history has been updated.",
            variant: "default",
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            <div className="flex justify-between items-center mb-4">
                <div className="flex space-x-4">
                    <button
                        className={`px-4 py-2 rounded-lg ${activeTab === 'files'
                            ? 'bg-primary text-black'
                            : 'bg-gray-200 text-gray-700'
                            }`}
                        onClick={() => setActiveTab('files')}
                    >
                        Generated Files
                    </button>
                    <button
                        className={`px-4 py-2 rounded-lg ${activeTab === 'chat'
                            ? 'bg-primary text-black'
                            : 'bg-gray-200 text-black'
                            }`}
                        onClick={() => setActiveTab('chat')}
                    >
                        Chat History
                    </button>
                </div>
                <button
                    onClick={handleRefresh}
                    className="p-2 rounded-lg hover:bg-gray-100"
                    title="Refresh"
                >
                    <RefreshCw className="h-5 w-5" />
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : (
                    <div className="dark:bg-black rounded-lg shadow-lg p-4">
                    {activeTab === 'files' ? (
                        <div className="space-y-4">
                            {files.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No files generated yet</p>
                            ) : ( 
                                files.map((file) => (
                                    <div
                                        key={file.id}
                                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex justify-between items-start ">
                                            <div>
                                                <h3 className="font-medium text-lg dark:text-white">{file.file_name}</h3>
                                                <p className="text-sm text-gray-500">
                                                    {formatDate(file.created_at)}
                                                </p>
                                            </div>
                                            <div className="flex space-x-2">
                                                <a
                                                    href={file.public_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-4 py-2 bg-primary text-black rounded hover:bg-primary/90 transition-colors"
                                                >
                                                    Download
                                                </a>
                                                <button
                                                    onClick={() => handleDeleteFile(file.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    disabled={deleteLoading === file.id}
                                                >
                                                    {deleteLoading === file.id ? (
                                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                                                    ) : (
                                                        <Trash2 className="h-5 w-5" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {messages.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No chat history yet</p>
                            ) : (
                                messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'
                                            }`}
                                    >
                                        <div
                                            className={`max-w-[80%] rounded-lg p-4 ${msg.role === 'user'
                                                ? 'bg-primary text-black'
                                                : 'bg-gray-200 text-gray-800'
                                                }`}
                                        >
                                            <p className="whitespace-pre-wrap">{msg.message}</p>
                                            <p className="text-xs mt-2 opacity-75">
                                                {formatDate(msg.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
