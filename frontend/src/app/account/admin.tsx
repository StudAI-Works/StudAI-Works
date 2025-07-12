import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Header } from '@/components/header';

interface UserProfile {
    email: string;
    full_name: string;
    bio: string;
    avatar_url?: string;
}

function Admin() {
    const [data, setData] = useState<UserProfile[]>([]);
    const BASE_URL: string = "http://localhost:8080";

    useEffect(() => {
        axios.get(`${BASE_URL}/allusers`)
            .then((res) => setData(res.data))
            .catch((err) => console.error("Error fetching users:", err));
    }, []);

    return (
        
        <div className="min-h-screen p-6">
           
            <h1 className="text-3xl text-center dark:text-white mb-8 text-black mt-4">Admin Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                {data.map((user, index) => (
                    <div key={index} className="bg-black hover:scale-105 transition-all duration-150 dark:bg-white  dark:text-white shadow-lg rounded-2xl p-4 flex items-center gap-4 hover:shadow-xl ">
                        <img
                            src={user.avatar_url || "https://cdn-icons-png.flaticon.com/512/3177/3177440.png"}
                            alt={`${user.full_name}'s avatar`}
                            className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
                        />
                        <div className='dark:text-black text-white'>
                            <p className="text-lg font-semibold ">{user.full_name}</p>
                            <p className="text-sm ">{user.email}</p>
                            <p className="text-sm mt-1">{user.bio || "No bio available"}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Admin;
