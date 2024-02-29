"use client";

import { useFormState, useFormStatus } from "react-dom";
import { uploadFileFromForm, deleteFileFromForm } from "./s3.js";

const formInitialState = {
  message: null,
};

function SubmitButton({ text }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" aria-disabled={pending}>
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
      <label htmlFor="filename">Filename</label>
      <input type="text" id="filename" name="filename" required />
      <label htmlFor="contents">Contents</label>
      <input type="text" id="contents" name="contents" required />
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
