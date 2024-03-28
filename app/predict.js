"use server";

import { getCurrentUser } from "@/app/actions.js";

export async function runGBMPrediction(prevState, formData) {
  const user = await getCurrentUser();
  if (!user) {
    return {
      status: 401,
      message: "Your session may have expired. Please log in again.",
    };
  } else if (!formData.get("filename").startsWith(user.id)) {
    console.log("Fishy activity detected");
    return { status: 403, message: "Forbidden" };
  }

  try {
    const resp = await fetch(`${process.env.KIDNEY_MODEL_SERVER}/predict`, {
      method: "POST",
      body: formData,
    });
    const predresults = await resp.json();
    return predresults;
  } catch (error) {
    return {
      status: 500,
      message:
        "Something went wrong while querying the prediction server: " + error,
    };
  }
}
