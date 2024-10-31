"use client";
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface Booking {
    _id: string;
    driverName: string;
    vehicleType: string;
    vehicleNumber: string;
    contactNumber: string;
    timestamp: string; // Keep it as a string since it comes from the API
}

interface UserHistoryResponse {
    _id: string;
    user_id: string;
    bookings: Booking[];
}

const BookedCabs = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const router = useRouter();

    useEffect(() => {
        const fetchBookings = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No token found. User may not be logged in.');
                return; 
            }
            const userId = JSON.parse(atob(token.split('.')[1])).userId;
            try {
                const response = await axios.get<UserHistoryResponse[]>(`http://localhost:5000/api/userHistory/${userId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                
                // Extract bookings from the response data
                const allBookings = response.data.flatMap((item) => item.bookings);
                setBookings(allBookings); // Set the combined bookings

            } catch (error) {
                console.error('Error fetching bookings:', error);
            }
        };

        fetchBookings();
    }, []);

    return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ width: '100%', display: 'flex' }}>
                <nav style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between' }}>
                    <button style={{ width: '20%' }} onClick={() => router.push('/search')}>Search</button>
                    <button style={{ width: '20%' }} onClick={() => router.push('/booked-cabs')}>History</button>
                </nav>
            </div>
            <h2>Booked Cabs</h2>
            <div style={{ margin: 'auto', width: '80%' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={{ border: '1px solid black', padding: '8px' }}>Sr. No.</th>
                            <th style={{ border: '1px solid black', padding: '8px' }}>Driver Name</th>
                            <th style={{ border: '1px solid black', padding: '8px' }}>Vehicle Type</th>
                            <th style={{ border: '1px solid black', padding: '8px' }}>Vehicle Number</th>
                            <th style={{ border: '1px solid black', padding: '8px' }}>Contact Number</th>
                            <th style={{ border: '1px solid black', padding: '8px' }}>Timestamp</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.map((booking, index) => (
                            <tr key={index + 1} style={{ border: '1px solid black' }}>
                                <td style={{ border: '1px solid black', padding: '8px' }}>{index + 1}</td>
                                <td style={{ border: '1px solid black', padding: '8px' }}>{booking.driverName}</td>
                                <td style={{ border: '1px solid black', padding: '8px' }}>{booking.vehicleType}</td>
                                <td style={{ border: '1px solid black', padding: '8px' }}>{booking.vehicleNumber}</td>
                                <td style={{ border: '1px solid black', padding: '8px' }}>{booking.contactNumber}</td>
                                <td style={{ border: '1px solid black', padding: '8px' }}>{new Date(booking.timestamp).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BookedCabs;
