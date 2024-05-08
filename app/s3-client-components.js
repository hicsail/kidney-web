"use client";

import { useFormStatus } from "react-dom";

function SubmitButton({ text }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      aria-disabled={pending}
      className="px-4 py-1 rounded-full bg-slate-200 border border-black hover:text-white hover:bg-slate-600"
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
      <br />
      <input type="file" id="file" name="file" multiple required />
      <SubmitButton text="Add" />
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
