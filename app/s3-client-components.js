"use client";

import { useFormStatus } from "react-dom";
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

export function UploadFileForm({ uploadFormAction }) {
  return (
    <form action={uploadFormAction}>
      <label htmlFor="file" className="text-lg font-semibold">
        Upload files
      </label>
      <p className="text-sm text-gray-500 mt-1 pt-[0.5vh]">Upload one or more files.</p>
      <div className="mt-4 pt-[1.5vh] pl-[1vw]">
          <input type="file" id="file" name="file" multiple required />
      </div>
      <div className="mt-4 pt-[1.6vh]">
        <SubmitButton text="Upload" width="100%" />
      </div>
    </form>
  );
}

export function DeleteFileForm({ filename, deleteFormAction }) {
  return (
    <form action={deleteFormAction}>
      <input type="hidden" name="filename" value={filename} required />
      <SubmitButton text="Delete" />
    </form>
  );
}
