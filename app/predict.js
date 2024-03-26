"use server";

import { getCurrentUser } from "@/app/actions.js";

export async function runGBMPrediction(prevState, formData) {
  const user = await getCurrentUser();
  if (!user) {
    return { message: "Your session may have expired. Please log in again." };
  } else if (!formData.get("filename").startsWith(user.id)) {
    console.log("Fishy activity detected");
    return { message: "Unauthorized" };
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
      message:
        "Something went wrong while querying the prediction server: " + error,
    };
  }
}
