import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div>
      <h1>Welcome to the Smart Cab Allocation System</h1>
      <Link href="/login">
          Login
      </Link>

      <Link href="/register">
          Register
      </Link>
    </div>
  );
}
