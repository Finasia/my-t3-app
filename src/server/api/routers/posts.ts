import { z } from "zod";
import {createTRPCRouter, privateProcedure, publicProcedure} from "~/server/api/trpc";
import {clerkClient} from "@clerk/nextjs";
import {TRPCError} from "@trpc/server";
import {Ratelimit} from "@upstash/ratelimit";
import {Redis} from "@upstash/redis";
import {filterUserForClient} from "~/server/helpers/filterUserForClient";

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

      const { success } = await ratelimit.limit(authorId);
      if (!success) throw new TRPCError({ code: "TOO_MANY_REQUESTS" });

      const post = await ctx.prisma.post.create({
        data: {
          authorId,
          content: input.content,
        },
      });

      return post;
    }),
});

// Create a new ratelimiter, that allows 3 requests per 1 minute
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "1 m"),
  analytics: true,
});
