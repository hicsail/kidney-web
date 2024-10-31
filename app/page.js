
import Image from 'next/image';
import { getCurrentUser } from '@/app/actions';
import { ListUserDirContents } from '@/app/s3';
import { GBMMeasurementInterface } from '@/app/prediction-client-components';
import Navbar from '@/app/navbar';

function Greeting() {
    return (
      <div className="flex flex-col items-center justify-between space-x-5 pt-40">
        <h1 className="text-2xl font-bold pb-10 ">Hello, kidney researcher.</h1>
        <a
          href={
            process.env.AUTH_LOGIN_URL +
            "/?projectId=" +
            process.env.AUTH_PROJECTID
          }
          className="pt-10" 
        >
          <button className="btn px-4 py-1 rounded-full border border-black hover:text-white hover:bg-black">
            Log in with SAIL auth
          </button>
        </a>
      </div>
    );
}

export default async function Home() {
  const user = await getCurrentUser();
  const files = user ? await ListUserDirContents() : null;

  return (
    <main className="flex min-h-screen flex-col px-[1vw]">
      <Navbar user={user} />
      <div className="pt-[10vh] pb-[3vh]" >
        { !user && <Greeting /> }
        <GBMMeasurementInterface user={user} files={files} />
      </div>
    </main>
  );
}
