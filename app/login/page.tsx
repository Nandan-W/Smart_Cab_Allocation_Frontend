"use client";
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/api/auth/login', { email, password });
            const token = response.data.token;
            // Store the token in local storage or a secure storage system
            localStorage.setItem('token', token);
            router.push('/search');
        } catch (error) {
            setError('Invalid credentials. Please try again.');
            console.log("login error")
            console.log(error);
    }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
            
            {error && <div style={{ color: 'red' }}> 
                {error}     
            </div>}
            <button type="submit">Login</button>
        </form>
    );
};

export default Login;
