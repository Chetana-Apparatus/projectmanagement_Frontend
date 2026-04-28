"use client";

import { User } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import Card from "@/components/common/card/Card";
import { useToast } from "@/components/common/toast/ToastProvider";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import PasswordInput from "@/components/ui/passwordInput";
import { apiFetch } from "@/lib/api-client";
import { getStoredUser } from "@/lib/auth-storage";

type Props = {
  roleLabel: string;
};

type MeData = {
  id: number;
  first_name?: string;
  last_name?: string;
  email: string;
  role?: string | null;
};

export default function AccountSettings({ roleLabel }: Props) {
  const USER_NAME_KEY = "userName";
  const USER_AVATAR_KEY = "userAvatar";
  const { showToast } = useToast();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    currentPassword: "",
    newPassword: "",
  });
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const storedAvatar = window.localStorage.getItem(USER_AVATAR_KEY);
    if (storedAvatar) setImage(storedAvatar);

    const bootstrap = async () => {
      const stored = getStoredUser();
      if (stored) {
        setForm((prev) => ({
          ...prev,
          firstName: stored.first_name ?? "",
          lastName: stored.last_name ?? "",
          email: stored.email ?? "",
        }));
      }

      try {
        const res = await apiFetch<MeData>("/api/v1/auth/me", {
          method: "GET",
        });
        if (!res.success || !res.data) return;
        const u = res.data;
        setForm((prev) => ({
          ...prev,
          firstName: u.first_name ?? "",
          lastName: u.last_name ?? "",
          email: u.email ?? "",
        }));
      } catch {
        // fallback to local values
      }
    };

    void bootstrap();
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

  const applyLocalProfile = (
    firstName: string,
    lastName: string,
    email: string,
  ) => {
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim() || "User";
    window.localStorage.setItem(USER_NAME_KEY, fullName);
    if (image) {
      window.localStorage.setItem(USER_AVATAR_KEY, image);
    } else {
      window.localStorage.removeItem(USER_AVATAR_KEY);
    }

    const storedRaw = window.localStorage.getItem("pms_user");
    if (storedRaw) {
      try {
        const parsed = JSON.parse(storedRaw) as Record<string, unknown>;
        parsed.first_name = firstName.trim();
        parsed.last_name = lastName.trim();
        parsed.email = email.trim();
        window.localStorage.setItem("pms_user", JSON.stringify(parsed));
      } catch {
        // ignore corrupt storage
      }
    }
    window.dispatchEvent(new Event("userUpdate"));
  };

  const updateProfile = async () => {
    if (!form.firstName.trim() && !form.lastName.trim()) {
      showToast("Please enter your first or last name", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch<MeData>("/api/v1/auth/me", {
        method: "PATCH",
        body: JSON.stringify({
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          email: form.email.trim(),
        }),
      });
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to update profile");
      }
      applyLocalProfile(
        res.data.first_name ?? form.firstName,
        res.data.last_name ?? form.lastName,
        res.data.email ?? form.email,
      );
      showToast(res.message || "Profile updated successfully", "success");
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : "Profile update failed",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async () => {
    if (form.newPassword.length < 6) {
      showToast("New password must be at least 6 characters", "error");
      return;
    }
    if (!form.currentPassword.trim()) {
      showToast("Current password is required", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch<MeData>("/api/v1/auth/me", {
        method: "PATCH",
        body: JSON.stringify({
          current_password: form.currentPassword,
          new_password: form.newPassword,
        }),
      });
      if (!res.success)
        throw new Error(res.message || "Failed to update password");
      setForm((prev) => ({ ...prev, currentPassword: "", newPassword: "" }));
      showToast(res.message || "Password updated successfully", "success");
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : "Password update failed",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h3 className="h3">Manage your profile</h3>
      </div>

      <Card className="!flex-col !items-start !justify-start p-6">
        <h2 className="ui-section-title mb-4">Profile</h2>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-cs-primary-100/30">
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
            <p className="ui-caption">{roleLabel}</p>
          </div>
          <div className="ml-auto flex gap-2">
            <Button onClick={() => fileRef.current?.click()}>Upload</Button>
            <Button
              variant="secondary"
              onClick={() => {
                setImage(null);
                showToast("Profile photo removed", "warning");
              }}
            >
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
        {error ? <p className="p1 mt-2 text-red-500">{error}</p> : null}
      </Card>

      <Card className="!flex-col !items-start !justify-start p-6">
        <h2 className="ui-section-title mb-4">General Information</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="ui-caption">
              First Name
            </label>
            <Input
              id="firstName"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="lastName" className="ui-caption">
              Last Name
            </label>
            <Input
              id="lastName"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
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
        <div className="mt-4 flex justify-end">
          <Button onClick={() => void updateProfile()} disabled={loading}>
            Save Profile
          </Button>
        </div>
      </Card>

      <Card className="!flex-col !items-start !justify-start p-6">
        <h2 className="ui-section-title mb-4">Change Password</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="currentPassword" className="ui-caption">
              Current Password
            </label>
            <PasswordInput
              id="currentPassword"
              value={form.currentPassword}
              onChange={(e) =>
                setForm({ ...form, currentPassword: e.target.value })
              }
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
          <Button onClick={() => void updatePassword()} disabled={loading}>
            Update Password
          </Button>
        </div>
      </Card>
    </div>
  );
}
