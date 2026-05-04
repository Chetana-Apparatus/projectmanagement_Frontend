"use client";

import { toast } from "react-toastify";

export type AppToastType = "success" | "error" | "warning" | "info";

export function showToast(message: string, type: AppToastType = "success") {
  switch (type) {
    case "success":
      toast.success(message);
      break;
    case "error":
      toast.error(message);
      break;
    case "warning":
      toast.warning(message);
      break;
    case "info":
      toast.info(message);
      break;
    default:
      toast(message);
  }
}

export function toastCreateSuccess(item: string) {
  showToast(`${item} created successfully`, "success");
}

export function toastUpdateSuccess(item: string) {
  showToast(`${item} updated successfully`, "success");
}

export function toastSaveSuccess() {
  showToast("Changes saved successfully", "success");
}

export function toastAddSuccess(item: string) {
  showToast(`${item} added successfully`, "success");
}

export function toastDeleteSuccess(item: string) {
  showToast(`${item} deleted successfully`, "success");
}

export function toastError(message = "Something went wrong") {
  showToast(message, "error");
}

export function toastWarning(message: string) {
  showToast(message, "warning");
}

export function toastInfo(message: string) {
  showToast(message, "info");
}
