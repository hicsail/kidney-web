"use client";

import { useState, useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { runGBMPrediction } from "@/app/predict.js";
import { UploadFileForm, DeleteFileForm } from "@/app/s3-client-components.js";
import { uploadFileFromForm, deleteFileFromForm } from "@/app/s3.js";
import { removeFilepathPrefix, changeExtension } from "@/app/utils.js";

function UserFiles({ files, currSelectedFile, setCurrSelectedFile }) {
  const [uploadFormState, uploadFormAction] = useFormState(uploadFileFromForm, {
    success: null,
    message: null,
  });
  const [deleteFormState, deleteFormAction] = useFormState(deleteFileFromForm, {
    success: null,
    message: null,
  });

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
                <DeleteFileForm
                  filename={file["Key"]}
                  deleteFormAction={deleteFormAction}
                />
              </li>
            ))}
      </ul>
      {deleteFormState.message && (
        <p
          className={
            deleteFormState.success ? "text-green-600" : "text-red-600"
          }
        >
          {deleteFormState.message}
        </p>
      )}
      <UploadFileForm uploadFormAction={uploadFormAction} />
      {uploadFormState.message && (
        <p
          className={
            uploadFormState.success ? "text-green-600" : "text-red-600"
          }
        >
          {uploadFormState.message}
        </p>
      )}
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
  const [predictionStatus, formAction] = useFormState(runGBMPrediction, {
    status: null,
    message: null,
    srcfile: null,
    measurement_mask_filepath: null,
    width_info_filepath: null,
  });

  function RunPredictForm() {
    function PredictionStatusReport() {
      if (!predictionStatus.status) {
        return;
      } else if (predictionStatus.status == 200) {
        return (
          <p>
            {predictionStatus.srcfile &&
              removeFilepathPrefix(predictionStatus.srcfile) + ": "}
            <span className="text-green-600">{predictionStatus.message}</span>
          </p>
        );
      } else if (predictionStatus.status == 400) {
        return (
          <p>
            {predictionStatus.srcfile &&
              removeFilepathPrefix(predictionStatus.srcfile) + ": "}
            <span className="text-fuchsia-600">{predictionStatus.message}</span>
          </p>
        );
      } else {
        return (
          <p>
            {predictionStatus.srcfile &&
              removeFilepathPrefix(predictionStatus.srcfile) + ": "}
            <span className="text-red-600">{predictionStatus.message}</span>
          </p>
        );
      }
    }
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
        <label htmlFor="pixelsize">Pixel size:</label>
        <input
          type="number"
          id="pixelsize"
          name="pixelsize"
          defaultValue={10}
          className="px-2"
          step="any"
          required
        />
        <label htmlFor="pixelsizeunit"> unit:</label>
        <input
          type="text"
          id="pixelsizeunit"
          name="pixelsizeunit"
          defaultValue="nm"
          className="px-2"
          required
        />
        <PredictButton />
        <PredictionStatusReport />
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
    const [predictionResult, setPredictionResult] = useState(undefined);

    useEffect(() => {
      if (!currSelectedFile) {
        return;
      }

      let ignore = false; //aborted fetch will set this to true

      async function startFetching() {
        const jsonfname = changeExtension(
          removeFilepathPrefix(currSelectedFile),
          "json",
        );

        try {
          const resp = await fetch(
            `/predictionresults/widthinfojsons/${jsonfname}`,
          );
          if (!ignore && resp.status == 200) {
            const widthinfojson = await resp.json();
            setPredictionResult(widthinfojson);
          } else if (!ignore) {
            setPredictionResult(undefined);
          }
        } catch (e) {
          console.log(e);
        }
      }
      startFetching();

      return () => {
        ignore = true;
      };
    }, [currSelectedFile]);

    function FieldsOrMessage() {
      const [showFullFPList, setShowFullFPList] = useState(false);

      if (!currSelectedFile) {
        return <p>Click on a file to view previously saved results.</p>;
      } else if (!predictionResult) {
        return (
          <div>
            <p>You have not run a prediction on this image yet.</p>
            <br />
            <p>Preview original input image:</p>
            <img
              src={`/predictionresults/inputs/${removeFilepathPrefix(currSelectedFile)}`}
              className="max-w-80 max-h-80"
            />
            <a
              href={`/predictionresults/inputs/${removeFilepathPrefix(currSelectedFile)}`}
              download
            >
              <button className="px-4 py-1 rounded-full bg-slate-200 border border-black hover:text-white hover:bg-slate-600">
                Download original
              </button>
            </a>
          </div>
        );
      } else {
        const pxsz = predictionResult.pixel_size;
        const unit = predictionResult.pixel_size_unit;

        const fpwidthsConverted = predictionResult.FP_widths.map(
          (x) => x * pxsz,
        );
        // Stringify FP widths as 1, 2, 3, ... instead of 1,2,3,... so that it can wrap when displayed
        const fpwidthsWrappable = JSON.stringify(fpwidthsConverted)
          .split(",")
          .join(", ");

        return (
          <div className="flex flex-col items-start gap-y-2">
            <div className="grid grid-cols-2">
              <p>Image ID:</p>
              <p>{predictionResult.image_id}</p>
              {/* TODO: Sort out input/output extension in prediction server */}
              <p>Pixel size:</p>
              <p>
                {pxsz} {unit}
              </p>
              <p>Skeleton length:</p>
              <p>
                {predictionResult.skeleton_length * pxsz} {unit}
              </p>
              <p>Area:</p>
              <p>
                {predictionResult.area * pxsz * pxsz} sq. {unit}
              </p>
              <p>GBM mean width:</p>
              <p>
                {predictionResult.GBM_mean_width * pxsz} {unit}
              </p>
              <p>FP number:</p>
              <p>{predictionResult.FP_num}</p>
              <p>FP mean width:</p>
              <p>
                {predictionResult.FP_mean_width * pxsz} {unit}
              </p>
              <p>FP widths:</p>
              {showFullFPList ? (
                <p className="text-wrap">
                  {fpwidthsWrappable} {unit}{" "}
                  <span
                    className="font-semibold hover:underline"
                    onClick={() => setShowFullFPList(!showFullFPList)}
                  >
                    (truncate)
                  </span>
                </p>
              ) : (
                <div className="flex flex-row">
                  <span className="line-clamp-1">
                    {fpwidthsWrappable} {unit}
                  </span>
                  <span
                    className="font-semibold hover:underline"
                    onClick={() => setShowFullFPList(!showFullFPList)}
                  >
                    (expand)
                  </span>
                </div>
              )}
            </div>
            <a
              href={`/predictionresults/widthinfojsons/${predictionResult.image_id}.json`}
              download
            >
              <button className="px-4 py-1 rounded-full bg-slate-200 border border-black hover:text-white hover:bg-slate-600">
                Download result JSON
              </button>
            </a>

            <div className="grid grid-cols-2">
              <p>Original image:</p>
              <p>GBM mask:</p>
              <img
                src={`/predictionresults/inputs/${predictionResult.image_id}.png`}
              />
              {/*TODO: change the extension into what is reported by the result*/}
              <img
                src={`/predictionresults/masks/${predictionResult.image_id}.png`}
              />
              <a
                href={`/predictionresults/inputs/${predictionResult.image_id}.png`}
                download
              >
                <button className="px-4 py-1 rounded-full bg-slate-200 border border-black hover:text-white hover:bg-slate-600">
                  Download original
                </button>
              </a>
              <a
                href={`/predictionresults/masks/${predictionResult.image_id}.png`}
                download
              >
                <button className="px-4 py-1 rounded-full bg-slate-200 border border-black hover:text-white hover:bg-slate-600">
                  Download mask
                </button>
              </a>
            </div>
          </div>
        );
      }
    }
    return (
      <div>
        <h1 className="text-lg font-semibold">Prediction result</h1>
        <FieldsOrMessage />
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
