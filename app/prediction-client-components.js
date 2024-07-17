"use client";

import { useState, useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { runGBMPrediction } from "@/app/predict.js";
import { UploadFileForm, DeleteFileForm } from "@/app/s3-client-components.js";
import { uploadFileFromForm, deleteFileFromForm } from "@/app/s3.js";
import { removeFilepathPrefix, changeExtension } from "@/app/utils.js";
import { useForm, Controller } from 'react-hook-form';
import '@/app/style.css';

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
    <div className="h-full w-70">
      <div className="flex flex-col space-y-4 bg-white p-4 rounded-lg shadow-md">
        <UploadFileForm uploadFormAction={uploadFormAction} />
        {uploadFormState.message && (
          <p className={uploadFormState.success ? "text-green-600" : "text-red-600"}>
            {uploadFormState.message}
          </p>
        )}
      </div>
      <div className="flex flex-col space-y-4 bg-white p-4 rounded-lg shadow-md mt-6 mb-6">
        <h1 className="text-lg font-semibold">Select a File</h1>
        <div className="w-60">
          <p className="text-sm text-gray-500">
            Select a file to run a segmentation prediction, classification, or generate a report. You can only select one file at a time.
          </p>
        </div>
        <div>
          <ul className="divide-y divide-slate-400 overflow-x-auto overflow-y-scroll">
            {files.length == 0
              ? "You have no uploaded files yet."
              : files.map((file) => (
                <li
                  key={file["Key"]}
                  onClick={() => setCurrSelectedFile(file["Key"])}
                  className={
                    "flex flex-row py-1 px-1 items-center justify-between hover:bg-blue-100" +
                    (file["Key"] == currSelectedFile ? " bg-blue-200" : "") +
                    " overflow-hidden"
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
            <div className="w-60">
              <p className={deleteFormState.success ? "text-green-600" : "text-red-600"}>
                {deleteFormState.message}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function GBMMeasurementInterface({ user, files }) {
  const [currentTab, setCurrentTab] = useState(0);
  const [currSelectedFile, setCurrSelectedFile] = useState(undefined);

  if (!user) {
    return <p>Log in to view your files and run predictions.</p>;
  }

  const tabs = [
    { label: 'Segmentation', content: <RunPredictionTab currSelectedFile={currSelectedFile} /> },
    { label: 'Classification', content: <EmptyTab /> },
    { label: 'Reports', content: <EmptyTab /> },
    { label: 'How to', content: <EmptyTab /> }
  ];

  return (
    <div className="flex flex-row space-x-4">
      <div>
        <UserFiles
          files={files}
          currSelectedFile={currSelectedFile}
          setCurrSelectedFile={setCurrSelectedFile}
        />
      </div>
      <div className="flex-1">
          <div className="flex space-x-0">
            {tabs.map((tab, index) => (
              <button
                key={index}
                className={`tab-button px-4 py-2 rounded-t-lg ${currentTab === index ? 'bg-white border border-b-0' : 'bg-gray-200'}`}
                onClick={() => setCurrentTab(index)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        <div className="bg-white p-4 rounded-b-lg shadow-md">
          {tabs[currentTab].content}
        </div>
      </div>
    </div>
  );
}

function RunPredictionTab({ currSelectedFile }) {
  const [predictionStatus, formAction] = useFormState(runGBMPrediction, {
    status: null,
    message: null,
    srcfile: null,
  });

  function RunPredictForm() {
    function PredictionStatusReport() {
      if (!predictionStatus.status) {
        return null;
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
          defaultValue={4.122}
          className="px-2"
          step="any"
          required
        />{" "}
        nm
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
        // Should be nm, but let prediction server report unit anyway.
        const unit = predictionResult.unit;

        // Stringify FP widths as 1, 2, 3, ... instead of 1,2,3,... so that it can wrap when displayed
        const fpwidthsWrappable = JSON.stringify(predictionResult.FP_widths)
          .split(",")
          .join(", ");

        return (
          <div className="flex flex-col items-start gap-y-2">
            <div className="grid grid-cols-2">
              <p>Image ID:</p>
              <p>{predictionResult.image_id}</p>
              <p>Pixel size:</p>
              <p>
                {predictionResult.pixel_size} {unit}
              </p>
              <p>Skeleton length:</p>
              <p>
                {predictionResult.skeleton_length} {unit}
              </p>
              <p>Area:</p>
              <p>
                {predictionResult.area} sq. {unit}
              </p>
              <p>GBM mean width:</p>
              <p>
                {predictionResult.GBM_mean_width} {unit}
              </p>
              <p>FP number:</p>
              <p>{predictionResult.FP_num}</p>
              <p>FP mean width:</p>
              <p>
                {predictionResult.FP_mean_width} {unit}
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
              <p>GBM and FP predictions:</p>
              <img
                src={`/predictionresults/inputs/${predictionResult.image_id}.${predictionResult.input_img_ext}`}
              />
              <img
                src={`/predictionresults/masks/${predictionResult.image_id}.${predictionResult.measurement_mask_ext}`}
              />
              <a
                href={`/predictionresults/inputs/${predictionResult.image_id}.${predictionResult.input_img_ext}`}
                download
              >
                <button className="px-4 py-1 rounded-full bg-slate-200 border border-black hover:text-white hover:bg-slate-600">
                  Download original
                </button>
              </a>
              <a
                href={`/predictionresults/masks/${predictionResult.image_id}.${predictionResult.measurement_mask_ext}`}
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
      <div className="flex space-x-4">
        <div className="w-1/2 bg-white p-4 rounded-lg shadow-md">
          <RunPredictForm />
        </div>
        <div className="w-1/2 bg-white p-4 rounded-lg shadow-md">
          <FieldsOrMessage />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PredictionResult />
    </div>
  );
}

function EmptyTab() {
  return <div>Content for this tab is not yet implemented.</div>;
}
