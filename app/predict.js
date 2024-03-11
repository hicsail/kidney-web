"use server";

export async function runGBMPrediction(prevState, formData) {
  // TODO...

  const resp = await fetch(`${process.env.KIDNEY_MODEL_SERVER}/predict`);
  console.log(resp.body);

  return {
    message: "Hello world, here's a fake prediction",
    srcfile: formData.get("filename"),
    gbmwidth: 42,
    mask: null,
  };
}
