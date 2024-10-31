import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div>
      <h1>Welcome to the Smart Cab Allocation System</h1>
      <div style={{ display: 'flex' , textAlign: 'center', justifyContent: 'center', margin:'auto' }}>
        <div style={{display: 'flex', flexDirection: 'column'}}>
          <Link href="/login">
              Login
          </Link>
        </div>

        <div style={{display: 'flex', flexDirection: 'column'}}>
          <Link href="/register">
              Register
          </Link>
        </div>
      </div>
    </div>
  );
}
