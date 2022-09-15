import { PrismaClient } from "@prisma/client";
import * as fcl from "@onflow/fcl";

const prisma = new PrismaClient();
fcl.config().put("accessNode.api", "https://rest-mainnet.onflow.org");

(async ()=>{

    await prisma.$connect()

    const data = await fcl.query({
        cadence: `
      pub fun main():Int{
        return 42
      }
    `,
    });
    console.log({data})

    console.log('nice')
    const locations = await prisma.location.findMany();
    console.log({ locations });


})()