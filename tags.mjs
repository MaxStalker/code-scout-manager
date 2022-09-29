import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

(async () => {
  const contracts = await prisma.contract.findMany({
	  take: 1,
	  skip: 2,
	  select: {
      id: true,
	    name: true
    },
  });
  console.log({ contracts });
  console.log(contracts.length)
})();
