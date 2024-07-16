// src/app/page.js or src/pages/index.js

import Image from 'next/image';
import { getCurrentUser } from '@/app/actions';
import { ListUserDirContents } from '@/app/s3';
import { GBMMeasurementInterface } from '@/app/prediction-client-components';
import Navbar from '@/app/navbar';

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

export default async function Home() {
  const user = await getCurrentUser();
  const files = user ? await ListUserDirContents() : null;

  return (
    <main className="flex min-h-screen flex-col p-24">
      <Navbar user={user} />
      <Greeting user={user} />
      <GBMMeasurementInterface user={user} files={files} />
    </main>
  );
}
