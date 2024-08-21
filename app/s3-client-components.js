"use client";

import { useFormStatus } from "react-dom";

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

export function UploadFileForm({ uploadFormAction }) {
  return (
    <form action={uploadFormAction}>
      <label htmlFor="file" className="text-lg font-semibold">
        Upload files
      </label>
      <p className="text-sm text-gray-500 mt-1 pt-[0.5vh]">Upload one or more files.</p>
      <div className="mt-2 pt-[1.5vh] pl-[0.7vw]">
          <input type="file" id="file" name="file" multiple required />
      </div>
      <div className="mt-2 pt-[1.6vh]">
        <SubmitButton text="Upload" width="100%" />
      </div>
    </form>
  );
}

export function DeleteFileForm({ filename, deleteFormAction }) {
  return (
    <form action={deleteFormAction}>
      <input type="hidden" name="filename" value={filename} required />
      <DeleteButton text="Delete" />
    </form>
  );
}
