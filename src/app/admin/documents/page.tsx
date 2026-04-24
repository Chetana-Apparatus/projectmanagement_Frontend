"use client";
import { Download, FileText, Trash2, Upload } from "lucide-react";
import { type DragEvent, useRef, useState } from "react";
import Card from "@/components/common/card/Card";
import Button from "@/components/ui/Button";

type FileItem = {
  id: number;
  name: string;
  type: string;
  date: string;
};

export default function DocumentUpload() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File) => {
    return file.name.endsWith(".docx") || file.name.endsWith(".md");
  };

  const handleFiles = (fileList: FileList) => {
    const newFiles: FileItem[] = [];

    Array.from(fileList).forEach((file, index) => {
      if (!validateFile(file)) {
        setError("Only .docx and .md files allowed");
        return;
      }

      newFiles.push({
        id: Date.now() + index,
        name: file.name,
        type: file.name.split(".").pop() || "",
        date: new Date().toLocaleDateString(),
      });
    });

    setFiles((prev) => [...prev, ...newFiles]);
    setError("");
  };

  const handleDrop = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleClickUpload = () => {
    inputRef.current?.click();
  };

  const handleUploadTriggerKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleClickUpload();
    }
  };

  if (files.length === 0) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <button
          type="button"
          onClick={handleClickUpload}
          onKeyDown={handleUploadTriggerKeyDown}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`w-full max-w-xl cursor-pointer border-2 border-dashed rounded-2xl p-12 text-center transition block ${
            dragging
              ? "border-cs-primary-100 bg-cs-primary-100/10 scale-[1.02]"
              : "border-cs-border hover:border-cs-primary-100 hover:bg-gray-50"
          }`}
        >
          <Upload className="mx-auto mb-4 text-cs-primary-200" size={36} />

          <p className="text-lg font-semibold mb-2">
            Upload your first document
          </p>

          <p className="p1 text-gray-500 mb-6">
            Drag & drop or click to upload (.docx, .md)
          </p>

          <div className="btn bg-cs-primary-200 text-white rounded-lg px-4 py-2 mx-auto inline-block">
            Upload File
          </div>

          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".docx,.md"
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />

          {error && <p className="text-red-500 p1 mt-4">{error}</p>}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 !flex-col !items-start !justify-start">
        <button
          type="button"
          onClick={handleClickUpload}
          onKeyDown={handleUploadTriggerKeyDown}
          className="w-full cursor-pointer border-2 border-dashed rounded-2xl p-6 text-center hover:bg-gray-50 transition block"
        >
          <Upload className="mx-auto mb-2 text-cs-primary-200" size={24} />
          <p className="text-sm">Upload more files</p>

          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".docx,.md"
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </button>
      </Card>

      <Card className="p-6 !flex-col !items-start !justify-start">
        <h2 className="ui-section-title mb-6">Uploaded Documents</h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full">
          {files.map((file) => (
            <div
              key={file.id}
              className="group relative rounded-2xl border border-cs-border p-4 hover:shadow-md transition"
            >
              <div className="flex items-center justify-center h-14 w-14 rounded-xl bg-cs-primary-100/20 mb-3">
                <FileText className="text-cs-primary-200" />
              </div>

              <p className="text-cs-text p1 font-medium truncate">
                {file.name}
              </p>

              <p className="p1   text-gray-500 mt-1">
                {file.type.toUpperCase()} • {file.date}
              </p>

              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100">
                <Button size="icon" variant="secondary">
                  <Download size={14} />
                </Button>

                <Button
                  size="icon"
                  variant="secondary"
                  className="text-red-500"
                  onClick={() =>
                    setFiles((prev) => prev.filter((f) => f.id !== file.id))
                  }
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
