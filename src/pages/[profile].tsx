import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";
import {createServerSideHelpers } from "@trpc/react-query/server";
import {appRouter} from "~/server/api/root";
import superjson from "superjson";
import {prisma} from "~/server/db";
import {PageLayout} from "~/components/layout";

const ProfilePage: NextPage<{ username: string }> = ({ username }) => {
  const { data,isLoading } = api.profile.getUserByUsername.useQuery({
    username,
  });
  if(isLoading) console.log("Profile Page is Loading!!!");
  if (!data) return <div>404</div>;
  return (
    <>
      <Head>
        <title>{data.username}</title>
      </Head>
      <PageLayout>
        <div>{data.username}</div>
      </PageLayout>
    </>
  );
};

export const getStaticProps: GetStaticProps = async (context) => {
  const ssg =createServerSideHelpers ({
    router: appRouter,
    ctx: {prisma,userId:null},
    transformer: superjson
  })

  const profile = context.params?.profile;

  if (typeof profile !== "string") throw new Error("no profile");

  const username = profile.replace("@", "");

  await ssg.profile.getUserByUsername.prefetch({ username });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      username,
    },
  };
};

export const getStaticPaths = () => {
  return { paths: [], fallback: "blocking" };
};

export default ProfilePage;
