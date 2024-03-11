"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { runGBMPrediction } from "@/app/predict.js";
import { UploadFileForm, DeleteFileForm } from "@/app/s3-client-components.js";

function UserFiles({ files, currSelectedFile, setCurrSelectedFile }) {
  return (
    <div className="flex flex-col space-y-5">
      <h1 className="text-lg font-semibold">Your files</h1>
      <ul className="space-y-1">
        {files.length == 0
          ? "You have no uploaded files yet."
          : files.map((file) => (
              <li key={file["Key"]}>
                <div
                  onClick={() => setCurrSelectedFile(file["Key"])}
                  className={
                    "flex flex-row items-center justify-between" +
                    (file["Key"] == currSelectedFile ? " bg-blue-300" : "")
                  }
                >
                  {/*Parse away the userdir prefix*/}
                  {file["Key"].split("/", 2)[1]}
                  <DeleteFileForm filename={file["Key"]} />
                </div>
              </li>
            ))}
      </ul>
      <UploadFileForm />
    </div>
  );
}

export function GBMMeasurementInterface({ user, files }) {
  if (!user) {
    return <p>Log in to view your files and run predictions.</p>;
  }
  // currently selected file is a single filename, and deliberately not a list;
  // this is because the client has explicitly said to only allow prediction
  // on one image at a time for now, due to uncertainties about how much time/
  // computation each prediction will take.
  const [currSelectedFile, setCurrSelectedFile] = useState(undefined);
  const [predictionResult, formAction] = useFormState(runGBMPrediction, {
    message: null,
    srcfile: null,
    gbmwidth: null,
    mask: null,
  });

  function RunPredictForm() {
    return (
      <form action={formAction}>
        <p>Current file: {currSelectedFile}</p>
        <input
          type="hidden"
          name="filename"
          value={currSelectedFile}
          required
        />
        <label htmlFor="pixelsize">Pixel size in nm:</label>
        <input type="number" id="pixelsize" name="pixelsize" />
        <PredictButton />
      </form>
    );
  }
  function PredictButton() {
    const { pending } = useFormStatus();
    const disabled = pending || currSelectedFile == undefined;

    return (
      <button
        type="submit"
        aria-disabled={disabled}
        disabled={disabled}
        className="px-4 py-1 rounded-full border border-black hover:text-white hover:bg-black"
      >
        Predict
      </button>
    );
  }

  return (
    <div className="flex flex-row">
      <div>
        <UserFiles
          files={files}
          currSelectedFile={currSelectedFile}
          setCurrSelectedFile={setCurrSelectedFile}
        />
      </div>
      <div>
        <RunPredictForm />
        {predictionResult.message && predictionResult.message}
        <p>Prediction source file: {predictionResult.srcfile || "n/a"}</p>
        <p>Predicted GBM width: {predictionResult.gbmwidth || "n/a"}</p>
        <p>Predicted GBM mask: (Not Currently Implemented)</p>
      </div>
    </div>
  );
}