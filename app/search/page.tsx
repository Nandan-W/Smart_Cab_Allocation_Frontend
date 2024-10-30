"use client";
// frontend/app/search/page.tsx
import { useState } from 'react';

const SearchCabs = () => {
    const [pickupLocation, setPickupLocation] = useState('');
    const [pickupTime, setPickupTime] = useState('');
    const [useCurrentLocation, setUseCurrentLocation] = useState(false);

    // Placeholder for cab data (you'll replace this with actual API data)
    const availableCabs = [
        {
            driverName: 'John Doe',
            currentLocation: '5th Avenue',
            distance: '2 km',
            vehicleType: 'Sedan',
            vehicleNumber: 'ABC-123',
            contactNumber: '123-456-7890',
        },
        // Add more cabs as needed
    ];

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // Logic to search for cabs based on pickupLocation and pickupTime
        // You can implement the API call to fetch available cabs here
        console.log('Search initiated:', pickupLocation, pickupTime);
    };

    const handleCurrentLocation = () => {
        // Logic to get the user's current location
        // For now, just toggle the input field
        setUseCurrentLocation(!useCurrentLocation);
        if (!useCurrentLocation) {
            // Auto-fill pickupLocation with current location (you'll implement this later)
            setPickupLocation('Current Location'); // Placeholder
        } else {
            setPickupLocation(''); // Clear the input if using current location
        }
    };

    return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
            <h2>Search Cabs Near You</h2>
            <form onSubmit={handleSearch}>
                <div>
                    <input
                        type="text"
                        placeholder="Pickup Location"
                        value={useCurrentLocation ? 'Current Location' : pickupLocation}
                        onChange={(e) => setPickupLocation(e.target.value)}
                        disabled={useCurrentLocation}
                        required
                    />
                    <input
                        type="datetime-local"
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>
                        <input
                            type="checkbox"
                            checked={useCurrentLocation}
                            onChange={handleCurrentLocation}
                        />
                        Or use your current location
                    </label>
                </div>
                <button type="submit">Search Cabs</button>
            </form>

            <h3>Available Cabs</h3>
            <table style={{ margin: '20px auto', width: '80%', borderCollapse: 'collapse' }}>
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
                    {availableCabs.map((cab, index) => (
                        <tr key={index}>
                            <td>{index + 1}</td>
                            <td>{cab.driverName}</td>
                            <td>{cab.currentLocation}</td>
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
