"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';

declare global {
    interface Window {
        google: any;
    }
}


interface Cab {
    driverName: string;
    currentLocation: [number, number]; 
    currentAddress:string;
    distance: string;
    vehicleType: string;
    vehicleNumber: string;
    contactNumber: string;
}

const SearchCabs = () => {
    const [pickupLocation, setPickupLocation] = useState('');
    const [dropLocation, setDropLocation] = useState('');
    const [cabs, setCabs] = useState<Cab[]>([]);

    useEffect(() => {
        const loadGoogleMaps = () => {
            if (window.google) return; // Prevent loading multiple times

            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
            script.async = true;
            script.defer = true;
            script.onload = () => {
                // Google Maps API loaded
            };
            document.body.appendChild(script);
        };

        loadGoogleMaps();

        return () => {
            const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
            if (existingScript) {
                document.body.removeChild(existingScript);
            }
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

        const token = localStorage.getItem('token');
        console.log('Token:', token);

        try {
            console.log("pickup = ",pickupCoords);
            console.log("drop = ",dropCoords);
            const response = await axios.post('http://localhost:5000/api/search/searchCabs', {
                pickupLocation: pickupCoords,
                dropLocation: dropCoords,
                shareCab: false, 
            }, {
                headers: {
                    Authorization: `Bearer ${token}`, // Set the Authorization header
                },
            });
            setCabs(response.data);
            initMap(response.data, pickupCoords);
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
    
    

    return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
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
                <button type="submit">Search Cabs</button>
            </form>


            <h3>Available Cabs</h3>
            <div id="map" style={{margin:'auto', height: '400px', width: '80%' }}></div>
            <table>
                <thead>
                    <tr>
                        <th>Sr. No.</th>
                        <th>Driver Name</th>
                        <th>Current Location</th>
                        <th>Distance</th>
                        <th>Vehicle Type</th>
                        <th>Vehicle Number</th>
                        <th>Contact Number</th>
                        <th>Select</th>
                    </tr>
                </thead>
                <tbody>
                    {cabs.map((cab: Cab, index: number) => (
                        <tr key={index}>
                            <td>{index + 1}</td>
                            <td>{cab.driverName}</td>
                            <td>{cab.currentAddress}</td> {/* Access as an array */}
                            <td>{cab.distance}</td>
                            <td>{cab.vehicleType}</td>
                            <td>{cab.vehicleNumber}</td>
                            <td>{cab.contactNumber}</td>
                            <td>
                                <button>Select</button>
                            </td>
                        </tr>
                    ))}
                </tbody>

            </table>
        </div>
    );
};

export default SearchCabs;
