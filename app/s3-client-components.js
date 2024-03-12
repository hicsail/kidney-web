"use client";

import { useFormState, useFormStatus } from "react-dom";
import { uploadFileFromForm, deleteFileFromForm } from "@/app/s3.js";

const formInitialState = {
  message: null,
};

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

export function UploadFileForm() {
  const [state, formAction] = useFormState(
    uploadFileFromForm,
    formInitialState,
  );
  return (
    <form action={formAction}>
      <label htmlFor="file" className="text-lg font-semibold">
        Upload files:
      </label>
      <br />
      <input type="file" id="file" name="file" multiple required />
      <SubmitButton text="Add" />
    </form>
  );
}

export function DeleteFileForm({ filename }) {
  const [state, formAction] = useFormState(
    deleteFileFromForm,
    formInitialState,
  );
  return (
    <form action={formAction}>
      <input type="hidden" name="filename" value={filename} required />
      <SubmitButton text="Delete" />
    </form>
  );
}
