import Image from "next/image";
import { getCurrentUser } from "./actions.js";
import { ListUserDirContents } from "./s3.js";

import { UploadFileForm, DeleteFileForm } from "./s3-client-components.js";

export default async function Home() {
  const user = await getCurrentUser();
  function GreetingText() {
    if (!user) {
      return `Hello, kidney enthusiast.`;
    } else if (user.fullname) {
      return `Hello, ${user.fullname}`;
    } else {
      return `Hello, ${user.email}`;
    }
  }
  function LoginLogout() {
    if (!user) {
      return (
        <a
          href={
            process.env.AUTH_LOGIN_URL +
            "/?projectId=" +
            process.env.AUTH_PROJECTID
          }
        >
          Log in with SAIL test auth
        </a>
      );
    } else {
      return <a href="/auth/logout">Log out</a>;
    }
  }
  async function UserFiles() {
    if (!user) {
      return <p>Log in to view your files.</p>;
    }
    const files = await ListUserDirContents(user);

    return (
      <>
        <h1>Your files</h1>
        <ul>
          {files.length == 0
            ? "You have no uploaded files yet."
            : files.map((file) => (
                <li key={file["Key"]}>
                  {
                    file["Key"].split(
                      "/",
                      2,
                    )[1] /*Parse away the userdir prefix*/
                  }
                  <DeleteFileForm filename={file["Key"]} />
                </li>
              ))}
        </ul>
        <UploadFileForm />
      </>
    );
  }
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1>{GreetingText()}</h1>
      <h1>{LoginLogout()}</h1>
      <UserFiles />
    </main>
  );
}
