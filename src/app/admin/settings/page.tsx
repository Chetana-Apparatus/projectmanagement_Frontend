"use client";
import { User } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/common/toast/ToastProvider";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import PasswordInput from "@/components/ui/passwordInput";
import Card from "../../../components/common/card/Card";

export default function SettingsForm() {
  const USER_NAME_KEY = "userName";
  const USER_AVATAR_KEY = "userAvatar";
  const { showToast } = useToast();
  const [form, setForm] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    password: "",
    newPassword: "",
  });
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const storedName = window.localStorage.getItem(USER_NAME_KEY);
    const storedAvatar = window.localStorage.getItem(USER_AVATAR_KEY);

    if (storedName) {
      const [firstName = "", ...rest] = storedName.trim().split(/\s+/);
      const lastName = rest.join(" ");
      setForm((prev) => ({
        ...prev,
        firstName: firstName || prev.firstName,
        lastName: lastName || prev.lastName,
      }));
    }

    if (storedAvatar) {
      setImage(storedAvatar);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!validTypes.includes(file.type)) {
      setError("Only JPG, PNG, WEBP allowed");
      showToast("Only JPG, PNG, WEBP allowed", "error");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("File size must be less than 2MB");
      showToast("File size must be less than 2MB", "warning");
      return;
    }

    setError(null);

    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
      showToast("Profile photo uploaded successfully", "success");
    };
    reader.readAsDataURL(file);
  };

  const handleUploadClick = () => {
    fileRef.current?.click();
  };

  const handleDelete = () => {
    setImage(null);
    showToast("Profile photo removed", "warning");
  };

  const handleSaveChanges = () => {
    const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();

    if (!fullName) {
      showToast("Please enter your first or last name", "error");
      return;
    }

    window.localStorage.setItem(USER_NAME_KEY, fullName);

    if (image) {
      window.localStorage.setItem(USER_AVATAR_KEY, image);
    } else {
      window.localStorage.removeItem(USER_AVATAR_KEY);
    }

    window.dispatchEvent(new Event("userUpdate"));
    showToast("Profile updated successfully", "success");
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="h3">Manage your profile</h3>
      </div>

      <Card className="p-6 !flex-col !items-start !justify-start">
        <h2 className="ui-section-title mb-4">Profile</h2>

        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-cs-primary-100/30 flex items-center justify-center overflow-hidden">
            {image ? (
              <Image
                src={image}
                alt="profile"
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            ) : (
              <User size={24} />
            )}
          </div>

          <div>
            <p className="ui-card-title">
              {form.firstName} {form.lastName}
            </p>
            <p className="ui-caption">Admin</p>
          </div>

          <div className="ml-auto flex gap-2">
            <Button onClick={handleUploadClick}>Upload</Button>
            <Button variant="secondary" onClick={handleDelete}>
              Delete
            </Button>
          </div>

          <input
            type="file"
            ref={fileRef}
            className="hidden"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
          />
        </div>

        {error && <p className="text-red-500 p1 mt-2">{error}</p>}
      </Card>

      <Card className="p-6 !flex-col !items-start !justify-start">
        <h2 className="ui-section-title mb-4">General Information</h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="ui-caption">
              First Name
            </label>
            <Input
              id="firstName"
              maxLength={10}
              value={form.firstName}
              onChange={(e) => {
                const value = e.target.value;

                if (value.length > 10) {
                  showToast("First name max 10 characters", "warning");
                  return;
                }

                setForm({ ...form, firstName: value });
              }}
            />
          </div>

          <div>
            <label htmlFor="lastName" className="ui-caption">
              Last Name
            </label>
            <Input
              id="lastName"
              maxLength={10}
              value={form.lastName}
              onChange={(e) => {
                const value = e.target.value;

                if (value.length > 10) {
                  showToast("Last name max 10 characters", "warning");
                  return;
                }

                setForm({ ...form, lastName: value });
              }}
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="email" className="ui-caption">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6 !flex-col !items-start !justify-start">
        <h2 className="ui-section-title mb-4">Change Password</h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="currentPassword" className="ui-caption">
              Current Password
            </label>
            <PasswordInput
              id="currentPassword"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="ui-caption">
              New Password
            </label>
            <PasswordInput
              id="newPassword"
              value={form.newPassword}
              onChange={(e) =>
                setForm({ ...form, newPassword: e.target.value })
              }
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            onClick={() => {
              if (form.newPassword.length < 6) {
                showToast("Password must be at least 6 characters", "error");
                return;
              }

              if (form.newPassword.length > 12) {
                showToast("Password must be max 12 characters", "warning");
                return;
              }

              showToast("Password updated successfully", "success");
            }}
          >
            Update Password
          </Button>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSaveChanges}>Save Changes</Button>
      </div>
    </div>
  );
}
