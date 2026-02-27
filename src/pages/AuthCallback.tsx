import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Session restoration is handled centrally in useAuth via getSession + auth listener.
    navigate("/", { replace: true });
  }, [navigate]);

  return <div>Redirecting...</div>;
};

export default AuthCallback;
