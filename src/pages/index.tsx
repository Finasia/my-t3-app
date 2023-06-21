import { type NextPage } from "next";
import Head from "next/head";
import {api} from "~/utils/api";
import type {RouterOutputs} from "~/utils/api";
import {SignInButton, SignOutButton, useUser} from "@clerk/nextjs";
import Image from "next/image";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {LoadingPage, LoadingSpinner} from "~/components/loading";
import {useState} from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import {PageLayout} from "~/components/layout";

dayjs.extend(relativeTime);

const Home: NextPage = () => {
  // const hello = api.example.hello.useQuery({ text: "from tRPC" });
  // console.log(hello.data?.greeting);

  const {isLoaded: userLoaded,isSignedIn} = useUser();

  // Start fetching asap(as soon as possible)
  api.posts.getAll.useQuery()

  // 关于isLoaded:
  // Until Clerk loads and initializes, `isLoaded` will be set to `false`.
  // Once Clerk loads, `isLoaded` will be set to `true`, and you can
  // safely access `isSignedIn` state and `user`.
  // 当Clerk加载和初始化完成后就会设置为true, ***不管你是否登录***
  // 此时你可以安全地访问isSignedIn状态和user
  if(!userLoaded) return <div/>

  return (
    <PageLayout>
      <div className="flex border-b border-slate-400 p-4">
        {!isSignedIn && (
          <div className="flex justify-center">
            <SignInButton/>
          </div>
        )}
        {!!isSignedIn && <CreatePostWizard/>}
      </div>
      <Feed/>
      <div className="flex items-center justify-between p-4 text-xl">
        <a href="https://github.com/Finasia/my-t3-app">
          <div className="flex items-center justify-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="white"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            <div>Github</div>
          </div>
        </a>
        <span>
          <a href="https://patreon.com/">🐦 My T3 App</a>
        </span>
      </div>
    </PageLayout>
  );
};

export default Home;

const CreatePostWizard = () => {
  const {user} = useUser();
  console.log('user:', user);

  const [input, setInput] = useState("");

  const ctx = api.useContext();
  const {mutate, isLoading: isPosting} = api.posts.create.useMutation({
    onSuccess: () => {
      setInput("");
      void ctx.posts.getAll.invalidate() //使用void忽略返回值，防止eslint报错
    },
    onError: (err) => {
      const errorMessages = err.data?.zodError?.fieldErrors.content;
      if (errorMessages && errorMessages[0]) {
        toast.error(errorMessages[0]);
      }
      else if(err.data?.code === "TOO_MANY_REQUESTS"){
        toast.error("The operation is too frequent! Please try again later.");
      }
      else {
        console.log(err);
        toast.error("Failed to post! Please try again later.");
      }
    }
  });

  if(!user) return null;

  return <div className="flex w-full gap-3">
    <Image
      src={user.profileImageUrl}
      alt="Profile image"
      width={56} height={56}
      className="w-14 h-14 rounded-full"
    />
    <input
      placeholder="Type some emojis!"
      className="bg-transparent grow outline-none"
      value={input} onChange={(e)=>setInput(e.target.value)}
      disabled={isPosting}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          if (input !== "") {
            mutate({ content: input });
          }
        }
      }}
    />
    {input !== "" && !isPosting && (
      <button onClick={() => mutate({ content: input })}>Post</button>
    )}
    {isPosting && (
      <div className="flex items-center justify-center">
        <LoadingSpinner size={20} />
      </div>
    )}
  </div>
};

// 这里的number是数组的索引，表示取数组里成员的类型，而不是数组本身的类型
// RouterOutputs['posts']['getAll'] 是我们api/routers/posts.ts里的getAll方法的返回值类型
type PostWithUser = RouterOutputs['posts']['getAll'][number]
const PostView = (props:PostWithUser) => {
  const {post,author} = props;
 return (
   <div key={post.id} className="flex border-b border-slate-400 p-4 gap-3">
     <Image
       src={author.profileImageUrl}
       className="w-14 h-14 rounded-full"
       alt={`@${author.username}`}
       width={56}
       height={56}
     />
     <div className="flex flex-col">
       <div className="flex gap-1 text-slate-300">
         <Link href={`/@${author.username}`}>
           <span>{`@${author.username} `}</span>
         </Link>
         <Link href={`/post/${post.id}`}>
            <span className="font-thin">{` · ${dayjs(
              post.createdAt
            ).fromNow()}`}</span>
         </Link>
       </div>
       <span className="text-2xl">{post.content}</span>
     </div>
   </div>
 )
};

const Feed = () => {
  // 这里的useQuery封装了react-query
  const { data,isLoading: postsLoading} = api.posts.getAll.useQuery();
  console.log('Home Feed data:',data);

  if(postsLoading) return <LoadingPage/>

  if(!data) return <div>Something went wrong</div>

  return (
    <div className="flex flex-col overflow-y-scroll">
      {
        data?.map((postWithAuthor) => (
          <PostView key={postWithAuthor.post.id} {...postWithAuthor} />
        ))
      }
    </div>
  )
}
