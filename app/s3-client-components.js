"use client";

import { useFormStatus } from "react-dom";
import { removeFilepathPrefix } from "@/app/utils.js"; // Ensure this import is present
import '@/app/style.css';

function SubmitButton({ text, width }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      aria-disabled={pending}
      className="btn" style={{ width: width || 'auto' }}
    >
      {text}
    </button>
  );
}

function DeleteButton({ text, width }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      aria-disabled={pending}
      className="delete-btn" style={{ width: width || 'auto' }}
    >
      {text}
    </button>
  );
}

export function UploadFileForm({ uploadFormAction, folderContents, selectedFolder, setSelectedFolder }) {
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      if (selectedFolder) {
        formData.append("folders", selectedFolder); // Append folders to form data
      }
      uploadFormAction(formData);
    }}>
      <label htmlFor="file" className="text-lg font-semibold">
        Upload files
      </label>
      <p className="text-sm text-gray-500 mt-1 pt-[0.5vh]">Upload one or more files.</p>
      <div className="mt-2 pt-[1.5vh] pl-[0.7vw]">
        <input type="file" id="file" name="file" multiple required />
      </div>
      <div className="flex flex-row pt-6">
        <label htmlFor="folder-select" className="px-2 py-1">Upload to:</label>
        <select
          id="folder-select"
          value={selectedFolder}
          onChange={(e) => setSelectedFolder(e.target.value)}
          className="flex-1 px-2 py-1 rounded border border-gray-300"
        >
          <option value="">Root</option>
          {folderContents
            .filter(item => item.Prefix && item.Prefix.endsWith("/"))
            .map((item, index) => (
              <option key={index} value={removeFilepathPrefix(item.Prefix)+'/'}>{removeFilepathPrefix(item.Prefix)}</option>
            ))}
        </select>
      </div>
      <div className="mt-2 pt-[1.6vh]">
        <SubmitButton text="Upload" width="100%" />
      </div>
    </form>
  );
}

export function DeleteFileForm({ filename, folders, deleteFormAction }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        formData.append("filename", filename);
        formData.append("folders", folders);
        deleteFormAction(formData);
      }}
    >
      <DeleteButton text="Delete" />
    </form>
  );
}
