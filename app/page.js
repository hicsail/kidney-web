import Image from "next/image";
import { getCurrentUser } from "./actions.js";
import { ListUserDirContents } from "./s3.js";

import { UploadFileForm, DeleteFileForm } from "./s3-client-components.js";

function Greeting({ user }) {
  if (!user) {
    return (
      <div className="flex flex-row items-center justify-between space-x-5">
        <h1>Hello, kidney enthusiast.</h1>
        <a
          href={
            process.env.AUTH_LOGIN_URL +
            "/?projectId=" +
            process.env.AUTH_PROJECTID
          }
        >
          <button className="px-4 py-1 rounded-full border border-black hover:text-white hover:bg-black">
            Log in with SAIL test auth
          </button>
        </a>
      </div>
    );
  } else {
    return (
      <div className="flex flex-row items-center justify-between space-x-5">
        <h1>Hello, {user.fullname ? user.fullname : user.email}.</h1>
        <a href="/auth/logout">
          <button className="px-4 py-1 rounded-full border border-black hover:text-white hover:bg-black">
            Log out
          </button>
        </a>
      </div>
    );
  }
}

async function UserFiles({ user }) {
  if (!user) {
    return <p>Log in to view your files.</p>;
  }
  const files = await ListUserDirContents(user);

  return (
    <div className="flex flex-col space-y-5">
      <h1 className="text-lg font-semibold">Your files</h1>
      <ul className="space-y-1">
        {files.length == 0
          ? "You have no uploaded files yet."
          : files.map((file) => (
              <li key={file["Key"]}>
                <div className="flex flex-row items-center justify-between">
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

export default async function Home() {
  const user = await getCurrentUser();
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Greeting user={user} />
      <UserFiles user={user} />
    </main>
  );
}
