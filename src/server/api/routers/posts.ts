import { z } from "zod";
import {createTRPCRouter, privateProcedure, publicProcedure} from "~/server/api/trpc";
import {clerkClient} from "@clerk/nextjs";
import type {User} from "@clerk/backend";
import {TRPCError} from "@trpc/server";

export const postsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.prisma.post.findMany({
      take: 100,
      orderBy: [{createdAt: "desc"}],
    });
    const users = (await clerkClient.users.getUserList({
      userId: posts.map((post) => post.authorId),
      limit: 100
    })).map(filterUserForClient);
    console.log('postsRouter getAll users:',users);

    return posts.map((post) => {
      const author = users.find((user) => user.id === post.authorId);
      if (!author || !author.username) throw new TRPCError({code: "INTERNAL_SERVER_ERROR", message: "Author for post not found" });
      return {
        post,
        author: {
          ...author,
          username: author.username //emmm 之所以这里脱裤子放屁式的这么操作，是因为ts太蠢了，它识别不了我们上已经在author.username为空的时候抛出了异常，走到这里来的一定是不为空的，但是ts还是会报错，所以我们只能这么做了
        }
      }
    })
  }),

  create: privateProcedure
    .input(
      z.object({
        content: z.string().emoji("Only emojis are allowed").min(1).max(280),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const authorId = ctx.userId;

      const post = await ctx.prisma.post.create({
        data: {
          authorId,
          content: input.content,
        },
      });

      return post;
    }),
});

const filterUserForClient = (user: User) => {
  return {
    id: user.id,
    username: user.username,
    profileImageUrl: user.profileImageUrl,
  }
}
