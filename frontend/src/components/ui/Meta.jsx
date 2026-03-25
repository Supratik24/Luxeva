import { useEffect } from "react";

const Meta = ({ title, description }) => {
  useEffect(() => {
    document.title = title ? `${title} | Luxeva` : "Luxeva";
    if (description) {
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute("content", description);
    }
  }, [description, title]);

  return null;
};

export default Meta;

