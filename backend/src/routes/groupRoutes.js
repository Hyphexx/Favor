import { Router } from "express";
import {
  createGroup,
  deleteGroup,
  joinGroup,
  listGroups,
} from "../controllers/groupController.js";

const router = Router();

router.get("/", listGroups);
router.post("/", createGroup);
router.post("/join", joinGroup);
router.delete("/:groupId", deleteGroup);

export default router;
