import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";

export const saveListRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    userId: string;
  };
}>();

saveListRouter
  .route("/")
  .get(async (c) => {
    const db = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const user_id = c.get("userId");

    try {
      const save_lists = await db.saveList.findMany({
        where: {
          user_id,
        },
        select: {
          id: true,
          title: true,
          posts: {
            select: {
              id: true,
            },
          },
          user: {
            select: {
              name: true,
            },
          },
        },
      });
      return c.json({
        save_lists,
      });
    } catch (error) {
      console.log(error);
      c.status(500);
      return c.json({
        msg: "Error while fetching savelists",
      });
    }
  })
  .post(async (c) => {
    const db = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const body: { title: string } = await c.req.json();
    const user_id = c.get("userId");
    console.log(user_id, "user id");

    try {
      const saveList = await db.saveList.create({
        data: {
          title: body.title,
          user_id,
        },
      });

      return c.json(saveList);
    } catch (error) {
      console.log(error);

      return c.json({
        error,
      });
    }
  });

saveListRouter.post("/save", async (c) => {
  console.log("Inside Save");

  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const body: {
    post_id: string;
    save_list_ids: number[];
  } = await c.req.json();

  const post_id = body.post_id;
  const save_list_ids = body.save_list_ids;

  const user_id = c.get("userId");

  try {
    await prisma.$transaction(async (db) => {
      const user_save_lists = await db.saveList.findMany({
        where: {
          id: { in: save_list_ids },
          user_id,
        },
      });

      console.log(user_save_lists);

      const user_save_list_ids = user_save_lists.map((sl) => sl.id);

      console.log(user_save_list_ids.length === save_list_ids.length);

      console.log(user_save_list_ids, save_list_ids);

      const connectPost = await db.post.update({
        where: {
          id: post_id,
        },
        data: {
          save_lists: {
            connect: user_save_list_ids.map((saveListId) => ({
              id: saveListId,
            })),
          },
        },
      });
    });
  } catch (error) {
    return c.json({
      msg: error,
    });
  }

  return c.json({
    msg: "Post saved successfully!",
  });
});

saveListRouter.post("/unsave", async (c) => {
  console.log("Inside Save");

  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const body: {
    post_id: string;
    save_list_ids: number[];
  } = await c.req.json();

  const post_id = body.post_id;
  const save_list_ids = body.save_list_ids;

  const user_id = c.get("userId");

  try {
    await prisma.$transaction(async (db) => {
      const user_save_lists = await db.saveList.findMany({
        where: {
          id: { in: save_list_ids },
          user_id,
        },
      });

      console.log(user_save_lists);

      const user_save_list_ids = user_save_lists.map((sl) => sl.id);

      const connectPost = await db.post.update({
        where: {
          id: post_id,
        },
        data: {
          save_lists: {
            disconnect: user_save_list_ids.map((saveListId) => ({
              id: saveListId,
            })),
          },
        },
      });
    });
  } catch (error) {
    return c.json({
      msg: error,
    });
  }

  return c.json({
    msg: "Post unsaved successfully!",
  });
});

saveListRouter.route("/:id").get(async (c) => {
  const db = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const {id} = c.req.param()

  const query = c.req.query()

  
  const page = parseInt(query.page)
  const pageSize = parseInt(query.pageSize)
  

  let currentPage = page - 1 < 0  ? 0 : page - 1 

  console.log("page: ", currentPage, "pageSize", pageSize);
  
  

  try {
    const saveList = await db.saveList.findUnique({
      where: {
        id: parseInt(id)
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        user: {
          select: {
            name: true,
          },
        },
        _count: true,
        posts:{
          skip: currentPage * pageSize || undefined,
          take: pageSize || undefined,
          select:{
            id: true,
            title: true,
            publishedAt: true,
            content:true,
            description:true,
            image: true,
            user: {
              select:{
                name: true
              }
            }
          }
        }
      },
      
    });

    return c.json(saveList);
  } catch (error) {
    console.log(error);
    console.log(error);

    return c.json({
      msg: error,
    });
  }
});
