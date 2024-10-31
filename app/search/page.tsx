"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import {useRouter} from 'next/navigation';
import { io, Socket } from 'socket.io-client';

declare global {
    interface Window {
        google: any;
    }
}

const SOCKET_SERVER_URL = 'http://localhost:5000';

interface Booking {
    cabId: string;
    driverName: string;
    vehicleType: string;
    vehicleNumber: string;
    contactNumber: string;
    timestamp: Date;
}

interface Cab {
    _id:string;
    driverName: string;
    currentLocation: [number, number]; 
    currentAddress:string;
    distance: string;
    vehicleType: string;
    vehicleNumber: string;
    contactNumber: string;
    travelCost: number;
    allowedSharing: boolean;
    currentPassengerCount: number;
}

const SearchCabs = () => {
    const [pickupLocation, setPickupLocation] = useState('');
    const [dropLocation, setDropLocation] = useState('');
    const [shareCab, setShareCab] = useState(false);
    const [cabs, setCabs] = useState<Cab[]>([]);

    const [socket, setSocket] = useState<Socket | null>(null);;
    const [connectionStatus, setConnectionStatus] = useState('connected'); // 'connected' or 'connecting'
    const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);


    const router = useRouter();

    const [searchTime, setSearchTime] = useState<number | null>(null); // Adding state for search time efficiency measurement
    const [resultSource, setResultSource] = useState('');


    useEffect(() => {
        const loadGoogleMaps = () => {
            if (window.google) return; // Prevent loading multiple times
    
            const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
            if (!existingScript) {
                const script = document.createElement('script');
                script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
                script.async = true;
                script.defer = true;
                script.onload = () => {
                    // Google Maps API loaded
                };
                document.body.appendChild(script);
            }
        };
    
        loadGoogleMaps();


        const newSocket = io(SOCKET_SERVER_URL);
        setSocket(newSocket);

        newSocket.on('connect', () => {
            setConnectionStatus('connected');
        });

        newSocket.on('disconnect', () => {
            setConnectionStatus('connecting');
        });

        // Handle updated cab data
        newSocket.on('updateCabs', (updatedCabs) => {
            if (window.location.pathname === '/search' &&pickupCoords && pickupLocation && dropLocation) {
                setCabs(updatedCabs);
                initMap(updatedCabs, pickupCoords); // Make sure to define pickupCoords correctly
            }
        });

        return () => {
            newSocket.disconnect();
        };
        
    }, []);

    const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const pickupCoords = await getCoordinates(pickupLocation);
        const dropCoords = await getCoordinates(dropLocation);
        if (!pickupCoords || !dropCoords) {
            console.error('Invalid coordinates');
            return;
        }
        setPickupCoords(pickupCoords);

        const token = localStorage.getItem('token');
        // console.log('Token:', token);

        try {
            // console.log("pickup = ",pickupCoords);
            // console.log("drop = ",dropCoords);
            const response = await axios.post('http://localhost:5000/api/search/searchCabs', {
                pickupLocation: pickupCoords,
                dropLocation: dropCoords,
                shareCab,
            }, {
                headers: {
                    Authorization: `Bearer ${token}`, // Set the Authorization header
                },
            });

            setSearchTime(response.data.time)
            const isFromCache = response.data.cache ? "from cache" : "from database";
            setResultSource(isFromCache);

            // Filtering out cabs that are full (currentPassengerCount >= 3)
            const availableCabs = response.data.results.filter((cab: Cab) => cab.currentPassengerCount < 3);
            setCabs(availableCabs);
            initMap(availableCabs, pickupCoords);
        } catch (error) {

            console.error('Error fetching cabs:', error);
        }
    };

    const getCoordinates = async (location: string): Promise<{ lat: number; lng: number } | null> => {
        if (!location) return null;
        try {
            const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
                params: {
                    address: location,
                    key: process.env.NEXT_PUBLIC_GOOGLE_GEOCODING_API_KEY,
                },
            });
            if (response.data.results.length > 0) {
                const { lat, lng } = response.data.results[0].geometry.location;
                return { lat, lng };
            }
            return null;
        } catch (error) {
            console.error('Error fetching coordinates:', error);
            return null;
        }
    };

    const initMap = (cabs: Cab[], pickupCoords: { lat: number; lng: number }) => {
        const map = new window.google.maps.Map(document.getElementById("map"), {
            zoom: 12,
            center: pickupCoords,
        });
    
        cabs.forEach(cab => {
            new window.google.maps.Marker({
                position: {
                    lat: cab.currentLocation[1], 
                    lng: cab.currentLocation[0], 
                },
                map,
                title: cab.driverName,
            });
        });
    };
    

    const handleUseCurrentLocation = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition((position) => {
                    const { latitude, longitude } = position.coords;
                    
                    getAddressFromCoords(latitude, longitude);
                }, (error) => {
                    console.error('Error getting location:', error);
                });
            } else {
                alert("Geolocation is not supported by this browser.");
            }
        } else {
            setPickupLocation(''); //  reset the pickup location if unchecked
        }
    };

    const getAddressFromCoords = async (lat: number, lng: number) => {
        try {
            const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
                params: {
                    latlng: `${lat},${lng}`,
                    key: process.env.NEXT_PUBLIC_GOOGLE_GEOCODING_API_KEY,
                },
            });
            if (response.data.results.length > 0) {
                setPickupLocation(response.data.results[0].formatted_address); // Set the pickup location to the formatted address
            } else {
                console.error('No address found for these coordinates.');
            }
        } catch (error) {
            console.error('Error fetching address:', error);
        }
    };
    
    // Add the select cab functionality
    const handleSelectCab = async (cab: Cab) => {
        
        console.log(`Cab booked: ${cab.driverName}`);

        // Increase the passenger count
        const updatedCab = { ...cab, currentPassengerCount: cab.currentPassengerCount + 1 };

        // Update passenger count in the backend
        await updatePassengerCount(updatedCab, 'increase');

        // Prepare booking details
        const bookingDetails = {
            cabId: cab._id,
            driverName: cab.driverName,
            vehicleType: cab.vehicleType,
            vehicleNumber: cab.vehicleNumber,
            contactNumber: cab.contactNumber,
            timestamp: new Date(),
        };

        // Get the userId from the token
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found. User may not be logged in.');
            return; 
        }
        const userId = JSON.parse(atob(token.split('.')[1])).userId;
        console.log("user id = ",userId);

        // Save the booking to user history
        await saveBookingToHistory(userId , bookingDetails);

        // Prepare driver details as a query string
        const driverDetails = JSON.stringify({
            driverName: cab.driverName,
            vehicleType: cab.vehicleType,
            vehicleNumber: cab.vehicleNumber,
            contactNumber: cab.contactNumber,
        });

        // Construct the URL with query parameters
        const queryString = new URLSearchParams({ driverDetails }).toString();

        // Push to the success page with the constructed URL
        router.push(`/success?${queryString}`);

        // Simulate dropping off the passenger after 10 minutes
        setTimeout(async () => {
            console.log(`Passenger dropped off from cab: ${cab.driverName}`);
            await updatePassengerCount(updatedCab, 'decrease'); // Update passenger count in the backend when dropped off
        }, 10 * 60 * 1000); // 10 minutes
    };

    const saveBookingToHistory = async (userId: string,booking: Booking) => {
        const token = localStorage.getItem('token');
        try {
            await axios.post('http://localhost:5000/api/userHistory', {
                userId,
                booking,
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
        } catch (error) {
            console.error('Error saving booking to history:', error);
        }
    };

    // Function to update passenger count in the backend
    const updatePassengerCount = async (cab: Cab, action: 'increase' | 'decrease') => {
        try {
            const newPassengerCount = action === 'increase' ? cab.currentPassengerCount : cab.currentPassengerCount - 1;

            await axios.post('http://localhost:5000/api/cab/updatePassengerCount', {
                cabId: cab._id,
                newPassengerCount:newPassengerCount,
            });
        } catch (error) {
            console.error(`Error updating passenger count: ${error}`);
        }
    };


    return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{width:'100%', display: 'flex'}}>
                <nav style={{width:'100%', flexDirection: 'row', justifyContent: 'space-between'}}>
                    <button style={{width:'20%'}} onClick={() => router.push('/search')}>Search</button>
                    <button style={{width:'20%'}} onClick={() => router.push('/booked-cabs')}>History</button>
                </nav>
            </div>
            <h2>Search Cabs Near You</h2>
            <form onSubmit={handleSearch}>
                <input
                    type="text"
                    placeholder="Pickup Location"
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    required
                />
                <label>
                    <input
                        type="checkbox"
                        onChange={handleUseCurrentLocation}
                    />
                    Use Current Location
                </label>
                <input
                    type="text"
                    placeholder="Drop Location"
                    value={dropLocation}
                    onChange={(e) => setDropLocation(e.target.value)}
                    required
                />
                <label>
                    <input
                        type="checkbox"
                        checked={shareCab}
                        onChange={(e) => setShareCab(e.target.checked)}
                    />
                    Allow Cab Sharing
                </label>
                <button type="submit">Search Cabs</button>
            </form>

            {cabs.length > 0 &&(
                <> 
                {searchTime !== null && (
                        <p>
                            Search time: {searchTime} ms ({resultSource})
                        </p> // Displaying search time and source for results(cache vs computing from memory)
                )}
                
               {/* Connection Status Indicator */}
                <div>
                    <span style={{ color: connectionStatus === 'connected' ? 'green' : 'orange' }}>
                        • {connectionStatus === 'connected' ? 'Connected to server' : 'Connecting to server'}
                    </span>
                </div>

                <h3>Available Cabs</h3>
                <div id="map" style={{margin:'auto', height: '400px', width: '80%' }}></div>
                <table>
                    <thead>
                        <tr>
                            <th>Sr. No.</th>
                            <th>Driver Name</th>
                            <th>Current Location</th>
                            <th>Distance(in km)</th>
                            <th>Vehicle Type</th>
                            <th>Vehicle Number</th>
                            <th>Contact Number</th>
                            <th>Travel Cost(in rupees)</th>
                            <th>Book Cab</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cabs.map((cab: Cab, index: number) => (
                            <tr key={index} style={{ border: (cab.allowedSharing && cab.currentPassengerCount > 0) ? '2px solid yellow' : '2px solid green' }} >
                                <td>{index + 1}</td>
                                <td>{cab.driverName}</td>
                                <td>{cab.currentAddress}</td> 
                                <td>{cab.distance}</td>
                                <td>{cab.vehicleType}</td>
                                <td>{cab.vehicleNumber}</td>
                                <td>{cab.contactNumber}</td>
                                <td>₹{cab.travelCost.toFixed(2)}</td>
                                <td>
                                    <button onClick={() => handleSelectCab(cab)}>Book</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>

                </table>
                </>
            ) }
        </div>
    );
};

export default SearchCabs;
