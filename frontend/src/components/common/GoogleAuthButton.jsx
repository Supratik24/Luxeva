import { useEffect, useRef, useState } from "react";

const GOOGLE_SCRIPT_ID = "google-identity-services";
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const loadGoogleScript = () =>
  new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve(window.google);
      return;
    }

    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID);
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.google), { once: true });
      existingScript.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(script);
  });

const GoogleAuthButton = ({ text = "continue_with", onCredential, onError }) => {
  const buttonRef = useRef(null);
  const [isAvailable, setIsAvailable] = useState(Boolean(googleClientId));

  useEffect(() => {
    let isMounted = true;

    if (!googleClientId || !buttonRef.current) {
      setIsAvailable(false);
      return undefined;
    }

    loadGoogleScript()
      .then((google) => {
        if (!isMounted || !google?.accounts?.id || !buttonRef.current) {
          return;
        }

        buttonRef.current.innerHTML = "";
        google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response) => onCredential?.(response.credential),
          ux_mode: "popup"
        });
        google.accounts.id.renderButton(buttonRef.current, {
          type: "standard",
          theme: "outline",
          text,
          shape: "pill",
          size: "large",
          width: buttonRef.current.offsetWidth || 360
        });
      })
      .catch((error) => {
        console.warn("Google sign-in button unavailable", error);
        if (isMounted) {
          setIsAvailable(false);
        }
        onError?.(error);
      });

    return () => {
      isMounted = false;
    };
  }, [onCredential, onError, text]);

  if (!isAvailable) {
    return null;
  }

  return <div ref={buttonRef} className="w-full overflow-hidden rounded-full" />;
};

export default GoogleAuthButton;
