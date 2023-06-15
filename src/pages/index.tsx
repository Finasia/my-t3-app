import { type NextPage } from "next";
import Head from "next/head";
import {api} from "~/utils/api";
import type {RouterOutputs} from "~/utils/api";
import {SignInButton, SignOutButton, useUser} from "@clerk/nextjs";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

const Home: NextPage = () => {
  // const hello = api.example.hello.useQuery({ text: "from tRPC" });
  // console.log(hello.data?.greeting);

  const user = useUser();
  console.log('Home user:',user);
  // 这里的useQuery封装了react-query
  const { data,isLoading} = api.posts.getAll.useQuery();
  console.log('Home data:',data);
  if(isLoading) return <div>Loading ...</div>
  if(!data) return <div>Something went wrong, data fetch failed</div>

  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex h-screen justify-center">
        <div className="w-full h-full border-x border-slate-400 md:max-w-2xl">
          <div className="border-b border-slate-400 p-4">
            {!user.isSignedIn && (
              <div className="flex justify-center">
                <SignInButton/>
              </div>
            )}
            {!!user.isSignedIn && <CreatePostWizard/>}
          </div>
          <div className="flex flex-col">
            {
              data?.map((postWithAuthor) => (
                <PostView key={postWithAuthor.post.id} {...postWithAuthor} />
              ))
            }
          </div>
        </div>
      </main>
    </>
  );
};

export default Home;

const CreatePostWizard = () => {
  const {user} = useUser();

  console.log('user:', user);

  if(!user) return null;

  return <div className="flex gap-3">
    <img src={user.profileImageUrl} alt="Profile image" className="w-14 h-14 rounded-full"/>
    <input placeholder="Type some emojis!" className="bg-transparent grow outline-none"/>
  </div>
};

// 这里的number是数组的索引，表示取数组里成员的类型，而不是数组本身的类型
// RouterOutputs['posts']['getAll'] 是我们api/routers/posts.ts里的getAll方法的返回值类型
type PostWithUser = RouterOutputs['posts']['getAll'][number]
const PostView = (props:PostWithUser) => {
  const {post,author} = props;
 return (
   <div key={post.id} className="flex border-b border-slate-400 p-4 gap-3">
     <img src={author.profileImageUrl} className="w-14 h-14 rounded-full" alt=""/>
     <div className="flex flex-col">
       <div className="flex text-slate-300 gap-1">
         <span>{`@${author.username}`}</span>
         <span className="font-thin">{` · ${dayjs(post.createdAt).fromNow()}`}</span>
       </div>
       <span>{post.content}</span>
     </div>
   </div>
 )
};
