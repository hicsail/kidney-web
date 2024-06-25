# kidney-web

The AI Digital Kidney Biopsy project builds tools for the analysis of TEM kidney images. Artificial intelligence and computer vision are utilized to measure and calculate properties of the kidney glomerular ultrastructure, for the purposes of aiding in clinical diagnosis and novel drug development. 

This repository contains the code for the web client component of the application; the back-end code is in a private repository outside of the hicsail GitHub account.

### Architecture and Deployment

At present, the back-end functionality is limited to running segmentation and prediction on an image; this functionality is accessible through a single endpoint `/predict` on the backend server. The inputs are a single image and a pixel size parameter; the outputs are one or more images (mask overlays) along with various metrics and metadata in JSON format. For the initial iteration of the web client, bulk jobs on batches of images are not supported.

Input images are uploaded by the user and stored in S3; outputs from each prediction are likewise stored in S3. Each user owns a subdirectory on the S3 bucket. The directory name is the user's id.

The web client leverages the [SAIL Authentication Service](https://github.com/hicsail/authentication-service) for auth and user management.

Both the web client and the prediction server are currently deployed on [NERC](https://nerc.mghpcc.org/) Red Hat OpenShift as serverless Knative deployments. The images are built and hosted directly on OpenShift. Note that the `compose.yaml` in this repository is used only for local development purposes. See `.env.local.example` for information on the environment variables that need to be configured on a deployment.

---

# Next.js

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!
