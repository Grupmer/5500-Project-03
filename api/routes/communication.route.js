import express from "express";
import {
  createCommunication,
  getCommunications,
  getCommunicationById,
  updateCommunication,
  deleteCommunication
} from "../controllers/communication.controller.js";

const router = express.Router();

router.post("/", createCommunication);
router.get("/", getCommunications);
router.get("/:id", getCommunicationById);
router.put("/:id", updateCommunication);
router.delete("/:id", deleteCommunication);

export default router; 