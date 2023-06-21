import type { NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";

const SinglePostPage: NextPage<{ id: string }> = ({ id }) => {

  return (
    <>
      <Head>
        <title>xxx post</title>
      </Head>
    </>
  );
};

export default SinglePostPage;
