import { Router } from "express";
import {
  acceptPickupRequest,
  changeStatus,
  createFavor,
  deleteFavor,
  dropFavor,
  listFavors,
  pickupFavor,
  withdrawPickupRequest,
} from "../controllers/favorController.js";

const router = Router();

router.get("/groups/:groupId/favors", listFavors);
router.post("/favors", createFavor);
router.patch("/favors/:favorId/pickup", pickupFavor);
router.delete("/favors/:favorId/pickup-request", withdrawPickupRequest);
router.patch("/favors/:favorId/requests/:userId/accept", acceptPickupRequest);
router.patch("/favors/:favorId/status", changeStatus);
router.patch("/favors/:favorId/drop", dropFavor);
router.delete("/favors/:favorId", deleteFavor);

export default router;
