import { Context, Next,  } from "hono";
import { verify } from "hono/jwt";
import { JWTPayload } from "hono/utils/jwt/types";

export const authMiddleware = async(c:Context<{
    Bindings: {
      DATABASE_URL: string;
      JWT_SECRET: string
    },
    Variables: {
        userId: string
    },

  }>, next:Next)=>{
    
    const header = c.req.header("authorization") || ""
  
    const token = header.split(" ")[1]

    console.log(token);
    
  
    if(!token){
      c.status(403)
      return c.json({
        status: "403",
        msg: "Unautorized / token missing"
      })
    }
  
    const response = await verify(token, c.env.JWT_SECRET)

    console.log(response, 'jwt verify response');
    
  
    if(response){
      console.log("IF RES");
      
      c.set("userId", String(response.id))
      console.log(c.get("userId"), "user id");

      return next()
    }
  
    c.status(403)
  
    return c.json({
      status: "403",
      msg: "Unauthorized"
    })
  
  
  }