"use client";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface DriverDetails {
    driverName: string;
    vehicleType: string;
    vehicleNumber: string;
    contactNumber: string;
}

const Success = ({ driverDetails } :{ driverDetails: DriverDetails}) => {
    const router = useRouter();

    useEffect(() => {
        const timeout = setTimeout(() => {
            router.push('/search');
        }, 5000); // Redirect after 5 seconds

        return () => clearTimeout(timeout); // Cleanup timeout on unmount
    }, [router]);

    return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
            <h2>Cab Booked Successfully!</h2>
            {driverDetails && (
                <div>
                    <h3>Driver Details</h3>
                    <p>Name: {driverDetails.driverName}</p>
                    <p>Vehicle Type: {driverDetails.vehicleType}</p>
                    <p>Vehicle Number: {driverDetails.vehicleNumber}</p>
                    <p>Contact Number: {driverDetails.contactNumber}</p>
                </div>
            )}
            <p>You will be redirected to the search page shortly.</p>
        </div>
    );
};

export default Success;
