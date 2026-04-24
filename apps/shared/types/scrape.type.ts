import z from "zod";
import { stringRequired } from "./zod";

export const scrapeSchema = z.object({
  sess: stringRequired,
  storeName: stringRequired,
  cf_clearance: stringRequired,
});


export interface IScrape extends z.infer<typeof scrapeSchema> {}