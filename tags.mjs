import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

(async () => {
  const contracts = await prisma.contract.findMany({
	  select: {
      id: true,
	    name: true
    },
  });
  console.log({ contracts });
  console.log(contracts.length)
})();
