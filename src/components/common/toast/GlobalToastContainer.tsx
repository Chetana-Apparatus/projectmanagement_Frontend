"use client";

import { ToastContainer } from "react-toastify";

export default function GlobalToastContainer() {
  return (
    <ToastContainer
      position="top-right"
      autoClose={3000}
      theme="colored"
      newestOnTop
      closeOnClick
      pauseOnHover
      draggable
    />
  );
}
