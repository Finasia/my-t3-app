import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";
import { PageLayout } from "~/components/layout";
import { PostView } from "~/components/postview";
import { generateSSGHelper } from "~/server/helpers/ssgHelper";

const SinglePostPage: NextPage<{ id: string }> = ({ id }) => {
  const { data } = api.posts.getById.useQuery({
    id,
  });
  if (!data) return <div>404</div>;

  return (
    <>
      <Head>
        <title>{`${data.post.content} - @${data.author.username}`}</title>
      </Head>
      <PageLayout>
        <PostView {...data} />
      </PageLayout>
    </>
  );
};

export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = generateSSGHelper();

  const id = context.params?.id;

  if (typeof id !== "string") throw new Error("no id");

  await ssg.posts.getById.prefetch({ id });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      id,
    },
  };
};

//https://nextjs.org/docs/pages/api-reference/functions/get-static-paths#fallback-blocking
//fallback: "blocking" 什么意思？
//
//The paths returned from getStaticPaths will be rendered to HTML at build time by getStaticProps.
//
//The paths that have not been generated at build time will not result in a 404 page.
//  Instead, Next.js will SSR on the first request and return the generated HTML.
//
//When complete, the browser receives the HTML for the generated path.
//  From the user’s perspective, it will transition from "the browser is requesting the page" to "the full page is loaded".
//  There is no flash of loading/fallback state.
//
//At the same time, Next.js adds this path to the list of pre-rendered pages.
//  Subsequent requests to the same path will serve the generated page, like other pages pre-rendered at build time.
//
//fallback: 'blocking' will not update generated pages by default. To update generated pages, use Incremental Static Regeneration in conjunction with fallback: 'blocking'.
//
//Good to know: fallback: 'blocking' is not supported when using output: 'export'.
export const getStaticPaths = () => {
  return { paths: [], fallback: "blocking" };
};

export default SinglePostPage;
