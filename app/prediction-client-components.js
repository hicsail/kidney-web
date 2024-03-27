"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { runGBMPrediction } from "@/app/predict.js";
import { UploadFileForm, DeleteFileForm } from "@/app/s3-client-components.js";
import { removeFilepathPrefix } from "@/app/utils.js";

function UserFiles({ files, currSelectedFile, setCurrSelectedFile }) {
  return (
    <div className="flex flex-col space-y-5">
      <h1 className="text-lg font-semibold">Your files</h1>
      <ul className="divide-y divide-slate-400">
        {files.length == 0
          ? "You have no uploaded files yet."
          : files.map((file) => (
              <li
                key={file["Key"]}
                onClick={() => setCurrSelectedFile(file["Key"])}
                className={
                  "flex flex-row py-1 px-1 items-center justify-between hover:bg-blue-100" +
                  (file["Key"] == currSelectedFile ? " bg-blue-200" : "")
                }
              >
                {removeFilepathPrefix(file["Key"])}
                <DeleteFileForm filename={file["Key"]} />
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
    pixelsize: null,
    skeleton_length: null,
    area: null,
    GBM_mean_width: null,
    FP_num: null,
    FP_mean_width: null,
    measurement_mask_filepath: null,
  });

  function RunPredictForm() {
    return (
      <form action={formAction}>
        <h1 className="text-lg font-semibold">Run a prediction</h1>
        {currSelectedFile ? (
          <p>Current file: {removeFilepathPrefix(currSelectedFile)}</p>
        ) : (
          <p>Click on a file to run a prediction.</p>
        )}
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
        className="px-4 py-1 rounded-full border border-black bg-slate-200 hover:text-white hover:bg-slate-600 disabled:border-slate-300 disabled:bg-slate-300 disabled:text-slate-500"
      >
        {pending ? <i>Pending...</i> : <>Predict</>}
      </button>
    );
  }
  function PredictionResult() {
    return (
      <div>
        <h1 className="text-lg font-semibold">Prediction result</h1>
        <p>Message: {predictionResult.message || "n/a"}</p>
        <p>
          Prediction source file:{" "}
          {removeFilepathPrefix(predictionResult.srcfile) || "n/a"}
        </p>
        <p>Pixel size: {predictionResult.pixelsize || "n/a"} nm</p>
        <p>Skeleton length: {predictionResult.skeleton_length || "n/a"} nm</p>
        <p>Area: {predictionResult.area || "n/a"} nm sq</p>
        <p>GBM mean width: {predictionResult.GBM_mean_width || "n/a"}</p>
        <p>FP number: {predictionResult["FP_num"] || "n/a"}</p>
        <p>FP mean width: {predictionResult.FP_mean_width || "n/a"}</p>

        <p>GBM mask:</p>
        {/*TODO: configurable hostname */}
        {/*TODO: change the extension into png*/}
        {/*TODO: only render image if... it exists/there is a prediction result...*/}
        {/*TODO: Also save rest of prediction result*/}
        <img
          src={`http://localhost:3000/predictionimages/masks/${removeFilepathPrefix(currSelectedFile)}`}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-row my-24 space-x-16">
      <div>
        <UserFiles
          files={files}
          currSelectedFile={currSelectedFile}
          setCurrSelectedFile={setCurrSelectedFile}
        />
      </div>
      <div className="space-y-4">
        <RunPredictForm />
        <PredictionResult />
      </div>
    </div>
  );
}
