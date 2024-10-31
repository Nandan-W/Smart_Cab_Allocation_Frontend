import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div>
      <h2>Welcome to the Smart Cab Allocation System</h2>
      <Link href="/login">
          Login
      </Link>

      <Link href="/register">
          Register
      </Link>
    </div>
  );
}
