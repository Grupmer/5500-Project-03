import express from "express";
import {
  createInterestDomain,
  getInterestDomains,
  getInterestDomainById,
  updateInterestDomain,
  deleteInterestDomain
} from "../controllers/interestDomain.controller.js";

const router = express.Router();

router.post("/", createInterestDomain);
router.get("/", getInterestDomains);
router.get("/:id", getInterestDomainById);
router.put("/:id", updateInterestDomain);
router.delete("/:id", deleteInterestDomain);

export default router; 