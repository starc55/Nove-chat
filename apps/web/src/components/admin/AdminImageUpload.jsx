import { useRef, useState } from "react";
import { ImagePlus, LoaderCircle, UploadCloud, X } from "lucide-react";
import { api } from "../../services/api.js";
import { xionAssetUrl } from "../../utils/landing-assets.js";

export function AdminImageUpload({ value = [], onChange, multiple = false, label = "Rasm yuklash" }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const images = Array.isArray(value) ? value.filter(Boolean) : value ? [value] : [];

  const upload = async (event) => {
    const files = [...(event.target.files || [])];
    event.target.value = "";
    if (!files.length) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("images", file));
      const { data } = await api.post("/admin/uploads/images", formData, { headers: { "Content-Type": "multipart/form-data" }, timeout: 60_000 });
      const urls = data.data.map((item) => item.url);
      onChange(multiple ? [...images, ...urls] : urls[0] || "");
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setUploading(false);
    }
  };

  const remove = (index) => {
    const next = images.filter((_, itemIndex) => itemIndex !== index);
    onChange(multiple ? next : "");
  };

  return <div className="admin-image-upload">
    <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple={multiple} onChange={upload} hidden/>
    <button type="button" className="admin-upload-trigger" onClick={() => inputRef.current?.click()} disabled={uploading}>
      {uploading ? <LoaderCircle className="admin-spin" size={18}/> : images.length ? <UploadCloud size={18}/> : <ImagePlus size={18}/>} 
      <span>{uploading ? "Yuklanmoqda…" : label}</span><small>JPG, PNG yoki WEBP · 5 MB gacha</small>
    </button>
    {error ? <p className="admin-upload-error" role="alert">{error}</p> : null}
    {images.length ? <div className="admin-upload-previews">{images.map((image, index) => <figure key={`${image}-${index}`}><img src={xionAssetUrl(image)} alt="Yuklangan rasm"/><button type="button" onClick={() => remove(index)} aria-label="Rasmni olib tashlash"><X size={14}/></button></figure>)}</div> : null}
  </div>;
}
