import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Camera, ImagePlus, UserCircle } from "lucide-react";
import { updateAvatar, updateProfile } from "../redux/actions/authActions";
import Loader from "../components/Loader";
import "./ProfileSetup.css";

export const ProfileSetup = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);
  const [name, setName] = useState("");
  const [about, setAbout] = useState("Hey there! I am using ChatApp.");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [formError, setFormError] = useState(null);
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      setFormError("Choose a JPEG, PNG, or WebP image smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setFormError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);

    try {
      await dispatch(updateProfile({ name, about })).unwrap();

      if (avatarFile) {
        await dispatch(updateAvatar(avatarFile)).unwrap();
      }

      navigate("/chat");
    } catch (error) {
      setFormError(error || "Unable to save your profile");
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="profile-photo-preview">
          {avatarPreview ? (
            <img src={avatarPreview} alt="Selected profile" />
          ) : (
            <UserCircle aria-hidden="true" />
          )}
        </div>

        <h2>Create Profile</h2>
        <p className="profile-photo-hint">
          Add a photo now or skip it and add one later.
        </p>

        <div className="profile-photo-actions">
          <button type="button" onClick={() => cameraInputRef.current?.click()}>
            <Camera size={18} />
            Take photo
          </button>
          <button type="button" onClick={() => galleryInputRef.current?.click()}>
            <ImagePlus size={18} />
            Choose image
          </button>
        </div>

        <input
          ref={cameraInputRef}
          className="visually-hidden"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="user"
          onChange={handleAvatarChange}
        />
        <input
          ref={galleryInputRef}
          className="visually-hidden"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleAvatarChange}
        />

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
          <textarea
            rows={4}
            value={about}
            onChange={(event) => setAbout(event.target.value)}
          />
          <button disabled={loading}>
            {loading ? "Saving..." : "Continue"}
          </button>
          {formError && (
            <p className="auth-error" role="alert">
              {formError}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};
