import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function AdminPasswordInput({ className = "", ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className={`admin-password-field ${className}`.trim()}>
      <input {...props} type={visible ? "text" : "password"} />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Parolni yashirish" : "Parolni ko‘rsatish"}
      >
        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}
