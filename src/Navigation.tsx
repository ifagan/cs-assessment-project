import { Link } from "react-router";
import { useSession } from "./SessionContext";

export default function Navigation() {
  const { session, loading } = useSession();

  if (loading) return null;        // don’t flash nav while session is loading
  if (!session) return null;       // hide nav if user is logged out

  return (
    <nav style={{ padding: "1rem" }}>
      <Link to="/projects">Projects</Link> |{" "}
      <Link to="/tasks">Tasks</Link> |{" "}
      <Link to="/profile">Edit Profile</Link>
    </nav>
  );
}
